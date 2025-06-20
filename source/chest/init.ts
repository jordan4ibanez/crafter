namespace chest {
	// todo: this is, horrible. This thing is storing fixed data as dynamic.
	// todo: rewrite this to not be a disaster.

	function get_chest_formspec(pos: Vec3): string {
		const spos =
			tostring(pos.x) + "," + tostring(pos.y) + "," + tostring(pos.z);
		const formspec =
			"size[9,8.75]" +
			"listcolors[#8b8a89;#c9c3c6;#3e3d3e;#000000;#FFFFFF]" +
			"background[-0.19,-0.25;9.41,9.49;gui_hb_bg.png]" +
			"list[nodemeta:" +
			spos +
			";main;0,0.3;9,4;]" +
			"list[current_player;main;0,4.5;9,1;]" +
			"list[current_player;main;0,6.08;9,3;9]" +
			"listring[nodemeta:" +
			spos +
			";main]" +
			"listring[current_player;main]"; //+
		//default.get_hotbar_bg(0,4.85)
		return formspec;
	}

	interface OpenChestData {
		pos: Vec3;
		sound: string;
		swap: string;
	}

	// Drops is being used as a reference.
	function get_inventory_drops(
		pos: Vec3,
		inventory: string,
		drops: ItemStackObject[]
	): void {
		const inv = core.get_meta(pos).get_inventory();
		for (let i = 1; i <= inv.get_size(inventory); i++) {
			const stack: ItemStackObject = inv.get_stack(inventory, i);
			if (stack.get_count() > 0) {
				drops.push(stack);
			}
		}
	}

	const open_chests = new Map<string, OpenChestData>();

	function chest_lid_close(pn: string) {
		const chest_open_info: OpenChestData | undefined = open_chests.get(pn);

		if (chest_open_info == null) {
			core.log(
				LogLevel.warning,
				`Chest open info for player [${pn}] is null. There is a chest stuck open.`
			);
			return;
		}

		const pos: Vec3 = chest_open_info.pos;
		const sound: string = chest_open_info.sound;
		const swap: string = chest_open_info.swap;

		open_chests.delete(pn);

		// See if any other player has this chest open.
		for (const [_, v] of open_chests) {
			if (v.pos.x == pos.x && v.pos.y == pos.y && v.pos.z == pos.z) {
				return true;
			}
		}

		const node: NodeTable = core.get_node(pos);

		core.after(
			0.2,
			(pos: Vec3, swap: string, node: NodeTable) => {
				if (core.get_node(pos).name == "crafter_chest:chest_open") {
					core.swap_node(pos, {
						name: "crafter_chest:" + swap,
						param2: node.param2,
					});
					core.sound_play(
						sound,
						{ gain: 0.3, pos: pos, max_hear_distance: 10 },
						true
					);
				}
				//redstone.collect_info(pos)
			},
			pos,
			swap,
			node
		);
	}

	core.register_on_player_receive_fields(
		(
			player: ObjectRef,
			formname: string,
			fields: Dictionary<string, any>
		) => {
			if (
				formname != "crafter_chest:chest" ||
				player == null ||
				fields.quit == null
			) {
				return;
			}
			const pn: string = player.get_player_name();
			if (!open_chests.has(pn)) {
				return;
			}
			chest_lid_close(pn);
			return true;
		}
	);

	core.register_on_leaveplayer((player: ObjectRef) => {
		const pn: string = player.get_player_name();
		if (open_chests.has(pn)) {
			chest_lid_close(pn);
		}
	});

	function destroy_chest(pos: Vec3): void {
		const meta: MetaRef = core.get_meta(pos);
		const inv: InvRef = meta.get_inventory();
		const lists: Dictionary<string, ItemStackObject[]> = inv.get_lists();
		for (const [listname, _] of pairs(lists)) {
			const size = inv.get_size(listname);
			for (let i = 1; i <= size; i++) {
				const stack: ItemStackObject = inv.get_stack(listname, i);
				core.add_item(pos, stack);
			}
		}
	}

	// You use this to make custom chests.
	export interface ChestDefinition extends NodeDefinition {
		sound_open: string;
		sound_close: string;
	}

	export function register_chest(name: string, def: ChestDefinition) {
		def.drawtype = Drawtype.mesh;
		// def.visual = "mesh"
		def.paramtype = ParamType1.light;
		def.paramtype2 = ParamType2.facedir;
		def.legacy_facedir_simple = true;
		def.is_ground_content = false;

		def.on_construct = (pos: Vec3) => {
			const meta: MetaRef = core.get_meta(pos);
			//meta:set_string("infotext", S("Chest"))
			const inv: InvRef = meta.get_inventory();
			inv.set_size("main", 9 * 4);
		};

		def.on_rightclick = (
			pos: Vec3,
			node: NodeTable,
			clicker: ObjectRef
		) => {
			if (
				core.get_node(pos).name != "crafter_chest:chest" &&
				core.get_node(pos).name != "crafter_chest:chest_open"
			) {
				return;
			}
			core.sound_play(
				def.sound_open,
				{ gain: 0.3, pos: pos, max_hear_distance: 10 },
				true
			);
			core.swap_node(pos, {
				name: "crafter_chest:" + name + "_open",
				param2: node.param2,
			});
			core.show_formspec(
				clicker.get_player_name(),
				"crafter_chest:chest",
				get_chest_formspec(pos)
			);
			open_chests.set(clicker.get_player_name(), {
				pos: pos,
				sound: def.sound_close,
				swap: name,
			});
			//redstone.collect_info(pos)
		};

		def.on_blast = (pos: Vec3) => {
			const drops: ItemStackObject[] = [];
			get_inventory_drops(pos, "main", drops);
			drops.push(ItemStack("crafter_chest:" + name));
			core.remove_node(pos);
			return drops;
		};

		def.on_destruct = destroy_chest;

		const def_opened: ChestDefinition = table.copy(
			def as any as LuaTable
		) as any as ChestDefinition;
		const def_closed: ChestDefinition = table.copy(
			def as any as LuaTable
		) as any as ChestDefinition;
		def_opened.mesh = "chest_open.obj";

		if (def_opened.tiles == null) {
			throw new Error("How");
		}

		for (let i = 0; i < def_opened.tiles.length; i++) {
			if (typeof def_opened.tiles[i] == "string") {
				def_opened.tiles[i] = {
					name: def_opened.tiles[i] as string,
					backface_culling: true,
				};
			} else if (
				typeof def_opened.tiles[i] == "object" &&
				(def_opened.tiles[i] as TileDefinition).backface_culling == null
			) {
				(def_opened.tiles[i] as TileDefinition).backface_culling = true;
			}
		}

		def_opened.drop = "crafter_chest:" + name;
		if (def_opened.groups == null) {
			throw new Error("Groups undefined.");
		}
		def_opened.groups.not_in_creative_inventory = 1;
		def_opened.selection_box = {
			type: Nodeboxtype.fixed,
			fixed: [-1 / 2, -1 / 2, -1 / 2, 1 / 2, 3 / 16, 1 / 2],
		};
		def_opened.on_blast = () => {};
		def_closed.mesh = undefined;
		def_closed.drawtype = undefined;

		if (def_closed.tiles == null || def.tiles == null) {
			throw new Error("Another issue.");
		}

		def_closed.tiles[5] = def.tiles[4]; // swap textures around for "normal"
		def_closed.tiles[4] = def.tiles[2]; // drawtype to make them match the mesh
		def_closed.tiles[2] = (def.tiles[2] as string) + "^[transformFX";
		core.register_node("crafter_chest:" + name, def_closed);
		core.register_node("crafter_chest:" + name + "_open", def_opened);
	}

	register_chest("chest", {
		description: "Chest",
		tiles: [
			"chest_top.png",
			"chest_top.png",
			"chest_side.png",
			"chest_side.png",
			"chest_front.png",
			"chest_inside.png",
		],
		sounds: crafter.woodSound(),
		sound_open: "default_chest_open",
		sound_close: "default_chest_close",
		groups: { wood: 2, hard: 1, axe: 1, hand: 3, pathable: 1 },
	});

	core.register_craft({
		output: "crafter_chest:chest",
		recipe: [
			["crafter:wood", "crafter:wood", "crafter:wood"],
			["crafter:wood", "", "crafter:wood"],
			["crafter:wood", "crafter:wood", "crafter:wood"],
		],
	});

	core.register_craft({
		type: CraftRecipeType.fuel,
		recipe: "crafter_chest:chest",
		burntime: 5,
	});

	const rNode = core.registered_nodes["crafter_chest:chest_open"];
	if (rNode == null) {
		throw new Error("Another issue");
	}
	const groups: Dictionary<string, number> | undefined = rNode.groups;
	if (groups == null) {
		throw new Error("Another issue again");
	}

	groups["redstone_torch"] = 1;
	groups["redstone_power"] = 9;

	core.override_item("crafter_chest:chest_open", {
		groups: groups,
	});
}

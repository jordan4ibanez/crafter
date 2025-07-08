namespace steam {
	const timerStart = kickOnSteamNodeTimer;
	const sootEntityWidth = (1 / 16) * 14;
	const sootIncrement = 0.05;

	class AshPanEntity extends types.Entity {
		name: string = "crafter_steam:ash_pan_entity";
		initial_properties: ObjectProperties = {
			pointable: false,
			visual: EntityVisual.cube,
			textures: [
				"steam_soot_block.png",
				"steam_soot_block.png",
				"steam_soot_block.png",
				"steam_soot_block.png",
				"steam_soot_block.png",
				"steam_soot_block.png",
			],
			visual_size: vector.create3d(0, 0, 0),
			static_save: false,
		};
	}
	utility.registerTSEntity(AshPanEntity);

	const ashPanEntities = new utility.NodeEntityContainer(AshPanEntity);

	class AshPanMeta extends utility.CrafterMeta {
		sootLevel: number = 0;
	}

	function manipulateAshPanEntity(pos: Vec3, entity: ObjectRef | null): void {
		if (entity == null) {
			// Cannot continue without an entity.
			core.log(LogLevel.warning, `Missing ash pan entity at ${pos}`);
			return;
		}

		const ashPanData = utility.getMeta(pos, AshPanMeta);

		if (ashPanData.sootLevel <= 0) {
			entity.set_properties({
				visual_size: vector.create3d(0, 0, 0),
			});
		} else {
			entity.set_pos(
				vector.create3d(
					pos.x,
					pos.y - 0.5 + ashPanData.sootLevel / 2 + 1 / 16,
					pos.z
				)
			);
			entity.set_properties({
				visual_size: vector.create3d(
					sootEntityWidth,
					ashPanData.sootLevel,
					sootEntityWidth
				),
			});
		}
	}

	const states = ["open", "closed"];
	for (const index of $range(0, 1)) {
		const currentState = states[index];
		core.register_node("crafter_steam:ash_pan_" + currentState, {
			drawtype: Drawtype.mesh,
			use_texture_alpha: TextureAlpha.clip,
			mesh: `steam_ash_pan_${currentState}.gltf`,
			tiles: [
				"steam_ash_pan_body.png",
				"steam_ash_pan_doors.png",
				"steam_ash_pan_lever.png",
				"stone.png",
				"dirt.png",
			],
			sunlight_propagates: true,
			paramtype: ParamType1.light,
			paramtype2: ParamType2["4dir"],
			groups: {
				stone: 2,
				ash_pan: 1,
				opened: currentState == "open" ? 1 : 0,
				steam_duct_tape: 1,
			},
			sounds: crafter.stoneSound(),

			on_timer(position, elapsed) {
				manipulateAshPanEntity(
					position,
					ashPanEntities.getOrCreate(position)
				);
				timerStart(position);
			},

			on_construct(position) {
				ashPanEntities.getOrCreate(position);
				timerStart(position);
			},

			on_rightclick(position, node, clicker, itemStack, pointedThing) {
				//? Open/close doors.
				const newIndex = (index + 1) % 2;
				const newState = states[newIndex];
				core.swap_node(position, {
					name: "crafter_steam:ash_pan_" + newState,
					param2: node.param2,
				});
				core.sound_play("steam_boiler_door", {
					pos: pointedThing.under!,
					pitch: (math.random(80, 99) + math.random()) / 100,
				});
			},

			on_punch(position, node, puncher, pointedThing) {
				if (puncher == null) {
					return;
				}

				// If it's not a shovel don't bother.
				if (
					core.get_item_group(
						puncher.get_wielded_item().get_name(),
						"shovel"
					) <= 0
				) {
					return;
				}

				const ashPanData = utility.getMeta(position, AshPanMeta);

				if (ashPanData.sootLevel <= 0) {
					return;
				}

				core.sound_play("steam_soot_shovel", {
					pos: position,
					pitch: (math.random(80, 99) + math.random()) / 100,
				});

				ashPanData.sootLevel -= sootIncrement;
				ashPanData.sootLevel =
					math.round(ashPanData.sootLevel * 100) / 100;

				if (ashPanData.sootLevel < 0) {
					ashPanData.sootLevel = 0;
				}
				ashPanData.write();

				manipulateAshPanEntity(
					position,
					ashPanEntities.getOrCreate(position)
				);
			},
		});
	}
}

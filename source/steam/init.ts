namespace steam {
	//~ Note:
	//~ This mod runs in imperial units.
	//~ The technology is as old as it's units.
	//~
	//~ Note 2:
	//~ Everything that can get hot will universally use the metadata identifier: temperature
	//~ This is in fahrenheit.

	/** PSI. */
	export const maxSafeBoilerPressure = 300;

	//? Stationary steam engine.

	const steamEngineEntityMap = new Map<number, ObjectRef>();

	export function kickOnSteamNodeTimer(pos: Vec3): void {
		const timer = core.get_node_timer(pos);
		if (!timer.is_started()) {
			//~ This one is production. Attempts to ease server load.
			// timer.start(1 + math.random());

			//? This one is for debugging.
			timer.start(1);
		}
	}

	class SteamEngine extends types.Entity {
		name: string = "crafter_steam:engine";

		initial_properties: ObjectProperties = {
			visual: EntityVisual.mesh,
			mesh: "steam_engine.gltf",
			visual_size: { x: 1, y: 1 },
			static_save: false,
			pointable: false,
			textures: [
				"steam_engine_base.png",
				"steam_engine_steam_inlet.png",
				"steam_engine_flywheel.png",
				"steam_engine_flywheel_spokes.png",
				"steam_engine_connecting_rod.png",
				"steam_engine_piston.png",
			],
		};

		on_activate(): void {
			// This will perpetually have 1 animation played at different speeds.
			this.object.set_animation({ x: 0, y: 1 }, 0, 0, true);
		}

		// on_punch(
		// 	puncher: ObjectRef | null,
		// 	timeFromLastPunch: number | null,
		// 	toolCapabilities: ToolCapabilities | null,
		// 	dir: Vec3 | null,
		// 	damage: number
		// ): void {
		// 	const newSpeed = math.random(0, 3) + math.random();
		// 	core.chat_send_all(tostring(newSpeed));

		// 	this.object.set_animation_frame_speed(newSpeed)
		// 	// this.object.set_animation({ x: 0, y: 1 }, newSpeed, 0, true);
		// }
	}
	utility.registerTSEntity(SteamEngine);

	function addSteamEngineEntity(
		logicControllerPos: Vec3,
		param2: number
	): void {
		const yaw = core.dir_to_yaw(core.fourdir_to_dir(param2)) + math.pi / 2;
		const dir = core.yaw_to_dir(yaw);
		const targetPos = vector.add(logicControllerPos, dir);
		const entity = core.add_entity(targetPos, "crafter_steam:engine");
		if (entity == null) {
			core.log(
				LogLevel.error,
				`Failed to add steam engine entity at ${targetPos}`
			);
			return;
		}
		entity.set_yaw(yaw);
		steamEngineEntityMap.set(
			core.hash_node_position(logicControllerPos),
			entity
		);
	}

	// This also functions as the steam inlet.
	core.register_node("crafter_steam:engine_logic_controller", {
		drawtype: Drawtype.airlike,
		paramtype: ParamType1.light,
		paramtype2: ParamType2["4dir"],
		groups: { stone: 2, steam: 1 },
		sounds: crafter.stoneSound(),
		sunlight_propagates: false,
		drop: "",
		node_placement_prediction: "",
		on_timer(position, elapsed) {
			core.get_node_timer(position).start(1);

			const hash = core.hash_node_position(position);

			let ent = steamEngineEntityMap.get(hash);

			if (ent == null || !ent.is_valid()) {
				const param2 = core.get_node(position).param2;

				if (param2 == null) {
					core.log(LogLevel.error, `No param2 at ${position}`);
					return;
				}

				addSteamEngineEntity(position, param2);

				ent = steamEngineEntityMap.get(hash);

				// Can only fight to get the entity to show up so much.
				if (ent == null || !ent.is_valid()) {
					return;
				}
			}
		},

		on_construct(position) {
			core.get_node_timer(position).start(1);
			const node = core.get_node(position);
			if (node.param2 == null) {
				core.log(LogLevel.error, `Missing param2 at ${position}`);
				return;
			}

			addSteamEngineEntity(position, node.param2);
			kickOnSteamNodeTimer(position);
		},

		after_destruct(position, oldNode) {
			if (oldNode.param2 == null) {
				core.log(LogLevel.error, `Missing param2 at ${position}`);
				return;
			}
			const yaw =
				core.dir_to_yaw(core.fourdir_to_dir(oldNode.param2)) +
				math.pi / 2;
			const dir = core.yaw_to_dir(yaw);
			const targetPos1 = vector.add(position, dir);
			const targetPos2 = vector.add(position, vector.multiply(dir, 2));
			core.remove_node(targetPos1);
			core.remove_node(targetPos2);

			const entity = steamEngineEntityMap.get(
				core.hash_node_position(position)
			);

			if (entity != null) {
				entity.remove();
			}
			steamEngineEntityMap.delete(core.hash_node_position(position));
		},
	});

	core.register_node("crafter_steam:engine_grease_point_1", {
		drawtype: Drawtype.airlike,
		paramtype: ParamType1.light,
		paramtype2: ParamType2["4dir"],
		groups: { stone: 2 },
		sounds: crafter.stoneSound(),
		drop: "",
		node_placement_prediction: "",
		sunlight_propagates: false,
		after_destruct(position, oldNode) {
			if (oldNode.param2 == null) {
				core.log(LogLevel.error, `Missing param2 at ${position}`);
				return;
			}
			const yaw = core.dir_to_yaw(core.fourdir_to_dir(oldNode.param2));
			const dir1 = core.yaw_to_dir(yaw - math.pi / 2);
			const dir2 = core.yaw_to_dir(yaw + math.pi / 2);
			const targetPos1 = vector.add(position, dir1);
			const targetPos2 = vector.add(position, dir2);
			core.remove_node(targetPos1);
			core.remove_node(targetPos2);
		},
	});

	core.register_node("crafter_steam:engine_grease_point_2", {
		drawtype: Drawtype.airlike,
		paramtype: ParamType1.light,
		paramtype2: ParamType2["4dir"],
		groups: { stone: 2 },
		sounds: crafter.stoneSound(),
		drop: "",
		node_placement_prediction: "",
		sunlight_propagates: false,
		after_destruct(position, oldNode) {
			if (oldNode.param2 == null) {
				core.log(LogLevel.error, `Missing param2 at ${position}`);
				return;
			}
			const yaw =
				core.dir_to_yaw(core.fourdir_to_dir(oldNode.param2)) -
				math.pi / 2;
			const dir = core.yaw_to_dir(yaw);
			const targetPos1 = vector.add(position, dir);
			const targetPos2 = vector.add(position, vector.multiply(dir, 2));
			core.remove_node(targetPos1);
			core.remove_node(targetPos2);
		},
	});

	core.register_node("crafter_steam:engine_item", {
		mesh: "steam_engine.gltf",
		drawtype: Drawtype.mesh,
		visual_scale: 0.5,
		paramtype2: ParamType2["4dir"],
		tiles: [
			"steam_engine_base.png",
			"steam_engine_steam_inlet.png",
			"steam_engine_flywheel.png",
			"steam_engine_flywheel_spokes.png",
			"steam_engine_connecting_rod.png",
			"steam_engine_piston.png",
		],
		node_dig_prediction: "",
		node_placement_prediction: "",
		on_place(itemStack, placer, pointedThing) {
			if (
				pointedThing.type != PointedThingType.node ||
				pointedThing.above == null ||
				pointedThing.under == null ||
				placer == null
			) {
				return;
			}
			// This is a 3 segment node, so things are a bit complicated.
			let currentPosTarget: Vec3;
			// Are we trying to place this thing above, or are we replacing what we're pointing at?
			{
				const aboveDef =
					core.registered_nodes[
						core.get_node(pointedThing.above).name
					];
				const underDef =
					core.registered_nodes[
						core.get_node(pointedThing.under).name
					];
				if (aboveDef == null || underDef == null) {
					return;
				}
				if (underDef.buildable_to) {
					currentPosTarget = pointedThing.under;
				} else if (aboveDef.buildable_to) {
					currentPosTarget = pointedThing.above;
				} else {
					// Can't build to nothing!
					return;
				}
			}
			// So first, bolt the look direction into 4 possible segments.
			const dir4 = core.dir_to_fourdir(placer.get_look_dir());
			// Next, transfer this into yaw.
			const yaw = core.dir_to_yaw(core.fourdir_to_dir(dir4));
			//? The controller will always sit to the left, so, +90 degrees.
			const dirController = core.yaw_to_dir(yaw - math.pi / 2);
			//? Grease point 1 will sit at the current position.
			//? Grease point 2 will sit to the right, so, -90 degrees.
			const grease2Dir = core.yaw_to_dir(yaw + math.pi / 2);
			// So now, we have where things need to go.
			// This should not be destroying random things that are not buildable to.
			// It must check if it can replace them or else bail out.
			const greasePosition1 = currentPosTarget;
			const controllerPosition = vector.add(
				greasePosition1,
				dirController
			);
			const greasePosition2 = vector.add(greasePosition1, grease2Dir);
			// Check for the room to build this thing.
			{
				let def =
					core.registered_nodes[
						core.get_node(controllerPosition).name
					];
				if (def == null || def.buildable_to != true) {
					return;
				}
				def =
					core.registered_nodes[core.get_node(greasePosition2).name];
				if (def == null || def.buildable_to != true) {
					return;
				}
			}
			// There is room! Hooray!
			core.set_node(controllerPosition, {
				name: "crafter_steam:engine_logic_controller",
				param2: dir4,
			});
			core.set_node(greasePosition1, {
				name: "crafter_steam:engine_grease_point_1",
				param2: dir4,
			});
			core.set_node(greasePosition2, {
				name: "crafter_steam:engine_grease_point_2",
				param2: dir4,
			});
		},
	});

	//? This is working around an issue where the node timers get corrupted.
	core.register_lbm({
		name: "crafter_steam:steam_kicker",
		nodenames: ["group:steam"],
		run_at_every_load: true,
		action: function (pos: Vec3, node: NodeTable, delta: number): void {
			kickOnSteamNodeTimer(pos);
		},
	});

	//? Metadata interfaces.
	//?
	//? These provide some attempt at synchronization of data components.

	/**
	 * This metadata holds water. (Percent)
	 */
	export interface WaterVesselMeta {
		/** Percentage. */
		waterLevel: number;
	}

	/**
	 * This metadata holds heat. (Fahrenheit)
	 */
	export interface HeatedVesselMeta {
		/** Fahrenheit. */
		temperature: number;
	}

	/**
	 * This metadata holds pressure. (PSI)
	 */
	export interface PressureVesselMeta {
		/** PSI. */
		pressure: number;
	}

	utility.loadFiles([
		"boiler",
		"firebox",
		"pipe",
		"sight_glass",
		"pressure_gauge",
		"thermometer",
	]);

	tnt.addDigNodes([
		"crafter_steam:boiler",
		"crafter_steam:firebox_open",
		"crafter_steam:firebox_closed",
		"crafter_steam:sight_glass",
	]);
}

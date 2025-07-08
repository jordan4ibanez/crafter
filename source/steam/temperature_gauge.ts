namespace steam {
	//? Implementation note:
	//?
	//? All this thing does is tell you the temperature of the boiler/firebox.
	//?
	//? It's a bit more important than it probably sounds.

	const timerStart = kickOnSteamNodeTimer;

	class TemperatureGaugeEntity extends types.Entity {
		name: string = "crafter_steam:temperature_gauge_entity";
		initial_properties: ObjectProperties = {
			pointable: false,
			visual: EntityVisual.mesh,
			mesh: "steam_temperature_gauge.gltf",
			textures: [
				"steam_temperature_gauge_inlet.png",
				"steam_temperature_gauge_case.png",
				"steam_temperature_gauge_diaphragm.png",
				"steam_temperature_gauge_back_plane.png",
				"steam_temperature_gauge_needle.png",
			],
			visual_size: vector.create3d(1, 1, 1),
			static_save: false,
		};
	}
	utility.registerTSEntity(TemperatureGaugeEntity);

	const temperatureGaugeEntities = new utility.NodeEntityContainer(
		TemperatureGaugeEntity,
		(pos: Vec3, entity: ObjectRef) => {
			const param2 = core.get_node(pos).param2;
			if (param2 != null) {
				entity.set_yaw(core.dir_to_yaw(core.fourdir_to_dir(param2)));
			} else {
				core.log(LogLevel.error, `Param2 at ${pos} doesn't exist.`);
			}
		}
	);

	// This is called boiler, because I have been working on the boiler code for so long.
	// It's just easier to understand. Everything that holds a temperature is a boiler.
	class BoilerTempShallowMeta
		extends utility.CrafterMeta
		implements HeatedVesselMeta
	{
		temperature: number = 0;
	}

	function manipulateTemperatureGaugeEntity(
		pos: Vec3,
		entity: ObjectRef | null
	): void {
		if (entity == null) {
			return;
		}

		// const param2 = core.get_node(pos).param2;
		// if (param2 == null) {
		// 	core.log(LogLevel.error, `Param2 dissapeared at ${pos}`);
		// 	return;
		// }

		// const dir = core.fourdir_to_dir(param2);

		// const newPos = vector.add(pos, dir);

		// // Not a steam water vessel.
		// if (
		// 	core.get_item_group(core.get_node(newPos).name, "water_vessel") <= 0
		// ) {
		// 	return;
		// }

		// const meta = utility.getMeta(newPos, BoilerShallowMeta);

		// // Convert to linear animation [0.0 - 1.0].
		// const newLevel = meta.waterLevel / 100.0;

		// entity.set_animation({ x: newLevel, y: newLevel }, 0, 0, false);
	}

	core.register_node("crafter_steam:temperature_gauge", {
		drawtype: Drawtype.airlike,
		sounds: crafter.stoneSound(),
		groups: { stone: 2 },
		paramtype: ParamType1.light,
		paramtype2: ParamType2["4dir"],
		sunlight_propagates: true,
		on_timer(position, elapsed) {
			manipulateTemperatureGaugeEntity(
				position,
				temperatureGaugeEntities.getOrCreate(position)
			);
			timerStart(position);
		},
		on_construct(position) {
			temperatureGaugeEntities.getOrCreate(position);
			timerStart(position);
		},
		on_destruct(position) {
			temperatureGaugeEntities.delete(position);
		},
	});
}

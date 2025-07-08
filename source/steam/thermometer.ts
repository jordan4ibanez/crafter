namespace steam {
	//? Implementation note:
	//?
	//? All this thing does is tell you the temperature of the boiler.
	//?
	//? It's a bit more important than it probably sounds.

	const timerStart = kickOnSteamNodeTimer;

	class ThermometerEntity extends types.Entity {
		name: string = "crafter_steam:thermometer_entity";
		initial_properties: ObjectProperties = {
			pointable: false,
			visual: EntityVisual.mesh,
			mesh: "steam_thermometer.gltf",
			textures: [
				"steam_thermometer.png",
				"steam_thermometer_water_texture.png",
			],
			visual_size: vector.create3d(1, 1, 1),
			static_save: false,
		};
	}
	utility.registerTSEntity(ThermometerEntity);

	const thermometerEntities = new utility.NodeEntityContainer(
		ThermometerEntity
	);

	class BoilerTempShallowMeta
		extends utility.CrafterMeta
		implements HeatedVesselMeta
	{
		temperature: number = 0;
	}

	function manipulateThermometerEntity(
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

	core.register_node("crafter_steam:thermometer", {
		drawtype: Drawtype.airlike,
		sounds: crafter.stoneSound(),
		groups: { stone: 2 },
		paramtype: ParamType1.light,
		paramtype2: ParamType2["4dir"],
		sunlight_propagates: true,
		on_timer(position, elapsed) {
			manipulateThermometerEntity(
				position,
				thermometerEntities.getOrCreate(position)
			);
			timerStart(position);
		},
		on_construct(position) {
			thermometerEntities.getOrCreate(position);
			timerStart(position);
		},
		on_destruct(position) {
			thermometerEntities.delete(position);
		},
	});
}

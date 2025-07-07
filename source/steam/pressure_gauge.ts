namespace steam {
	const timerStart = kickOnSteamNodeTimer;

	const pressureGaugeEntities = new Map<number, ObjectRef>();

	class PressureGaugeEntity extends types.Entity {
		name: string = "crafter_steam:pressure_gauge_entity";
		initial_properties: ObjectProperties = {
			pointable: false,
			visual: EntityVisual.mesh,
			mesh: "steam_pressure_gauge.gltf",
			textures: [
				"steam_pressure_gauge_dial.png",
				"steam_pressure_gauge_bracket.png",
				"steam_pressure_gauge_inlet.png",
				"steam_pressure_gauge_needle.png",
				"stone.png",
			],
			visual_size: vector.create3d(1, 1, 1),
			static_save: false,
		};
	}
	utility.registerTSEntity(PressureGaugeEntity);

	/**
	 * At the time of writing this, entities have no UUID.
	 * This fucking hackjob is getting around this issue.
	 * FUCK not having UUIDs.
	 */
	function getOrCreateEntity(pos: Vec3): ObjectRef | null {
		const hash = core.hash_node_position(pos);
		let entity = pressureGaugeEntities.get(hash) || null;
		if (entity == null || !entity.is_valid()) {
			entity = core.add_entity(
				pos,
				"crafter_steam:pressure_gauge_entity"
			);
			if (entity == null || !entity.is_valid()) {
				core.log(
					LogLevel.error,
					`Failed to add pressure gauge entity at ${pos}`
				);
				return null;
			}
		}
		pressureGaugeEntities.set(hash, entity);
		return entity;
	}

	function manipulatePressureGaugeEntity(
		pos: Vec3,
		entity: ObjectRef | null
	): void {}

	core.register_node("crafter_steam:pressure_gauge", {
		drawtype: Drawtype.airlike,
		sounds: crafter.stoneSound(),
		groups: { stone: 2 },
		paramtype: ParamType1.light,
		paramtype2: ParamType2["4dir"],
		sunlight_propagates: true,
		on_timer(position, elapsed) {
			manipulatePressureGaugeEntity(
				position,
				getOrCreateEntity(position)
			);
			timerStart(position);
		},
		on_construct(position) {
			getOrCreateEntity(position);
			timerStart(position);
		},
	});
}

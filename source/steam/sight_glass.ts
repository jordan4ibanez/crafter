namespace steam {
	const timerStart = kickOnSteamNodeTimer;

	const sightGlassEntities = new Map<number, ObjectRef>();

	class SightGlassEntity extends types.Entity {
		name: string = "crafter_steam:sight_glass_entity";
		initial_properties: ObjectProperties = {
			pointable: false,
			visual: EntityVisual.mesh,
			mesh: "steam_sight_glass.gltf",
			textures: [
				"steam_sight_glass.png",
				"steam_sight_glass_water_texture.png",
			],
			visual_size: vector.create3d(1, 1, 1),
			static_save: false,
		};
	}
	utility.registerTSEntity(SightGlassEntity);

	/**
	 * At the time of writing this, entities have no UUID.
	 * This fucking hackjob is getting around this issue.
	 * FUCK not having UUIDs.
	 */
	function getOrCreateEntity(pos: Vec3): ObjectRef | null {
		const hash = core.hash_node_position(pos);
		let entity = sightGlassEntities.get(hash) || null;
		if (entity == null || !entity.is_valid()) {
			entity = core.add_entity(pos, "crafter_steam:sight_glass_entity");
			if (entity == null || !entity.is_valid()) {
				core.log(
					LogLevel.error,
					`Failed to add sight glass entity at ${pos}`
				);
				return null;
			}
		}
		const param2 = core.get_node(pos).param2;
		if (param2 != null) {
			entity.set_yaw(core.dir_to_yaw(core.fourdir_to_dir(param2)));
		} else {
			core.log(LogLevel.error, `Param2 at ${pos} doesn't exist.`);
		}
		sightGlassEntities.set(hash, entity);
		return entity;
	}

	function manipulateSightGlassEntity(
		pos: Vec3,
		entity: ObjectRef | null
	): void {
		if (entity == null) {
			return;
		}

		const param2 = core.get_node(pos).param2;
		if (param2 == null) {
			core.log(LogLevel.error, `Param2 dissapeared at ${pos}`);
			return;
		}

		const dir = core.fourdir_to_dir(param2);

		const newPos = vector.add(pos, dir);

		// Not a steam water vessel.
		if (
			core.get_item_group(core.get_node(newPos).name, "water_vessel") <= 0
		) {
			return;
		}
	}

	core.register_node("crafter_steam:sight_glass", {
		drawtype: Drawtype.airlike,
		sounds: crafter.stoneSound(),
		groups: { stone: 2 },
		paramtype: ParamType1.light,
		paramtype2: ParamType2["4dir"],
		sunlight_propagates: true,
		on_timer(position, elapsed) {
			manipulateSightGlassEntity(position, getOrCreateEntity(position));
			timerStart(position);
		},
		on_construct(position) {
			getOrCreateEntity(position);
			timerStart(position);
		},
		on_destruct(position) {
			const hash = core.hash_node_position(position);
			const ent = sightGlassEntities.get(hash);

			if (ent == null) {
				return;
			}

			ent.remove();
			sightGlassEntities.delete(hash);
		},
	});
}

namespace steam {
	const timerStart = kickOnSteamNodeTimer;

	const fireBoxSounds = new Map<number, number>();

	const fireEntityWidth = (1 / 16) * 14;
	const coalIncrement = 0.05;
	const fireSoundLevelClosed = 0.4;
	const fireSoundLevelOpened = 1.0;

	// Burn rates.
	const coalBurnRateOpened = 0.0005;
	const coalBurnRateClosed = 0.00025;

	// Temperature control components.
	const temperatureIncrementOpened = 20;
	const temperatureIncrementClosed = 10;
	const temperatureDecrementOpened = 10;
	const temperatureDecrementClosed = 5;
	const maxTempOpened = 1800 - temperatureIncrementOpened;
	const maxTempClosed = 700;
	const maxTempIncreasingClosed = maxTempClosed - temperatureIncrementClosed;

	class FireboxMeta extends utility.CrafterMeta {
		onFire: boolean = false;
		coalLevel: number = 0;
		temperature: number = 0;
	}

	const coalTexturing = [
		"coalblock.png",
		"coalblock.png",
		"coalblock.png",
		"coalblock.png",
		"coalblock.png",
		"coalblock.png",
	];

	const onFireTexturing = [
		"steam_firebox_fire.png",
		"steam_firebox_fire.png",
		"steam_firebox_fire.png",
		"steam_firebox_fire.png",
		"steam_firebox_fire.png",
		"steam_firebox_fire.png",
	];

	class FireBoxFireEntity extends types.Entity {
		name: string = "crafter_steam:firebox_fire_entity";
		initial_properties: ObjectProperties = {
			pointable: false,
			visual: EntityVisual.cube,
			textures: coalTexturing,
			visual_size: vector.create3d(0, 0, 0),
			static_save: false,
		};
	}
	utility.registerTSEntity(FireBoxFireEntity);

	const fireboxEntities = new utility.NodeEntityContainer(FireBoxFireEntity);

	class AshPanMeta extends utility.CrafterMeta {
		sootLevel: number = 0;
	}

	interface AshPanBelowData {
		isAshPan: boolean;
		isOpened: boolean;
	}

	function getIfAshPanBelow(pos: Vec3): AshPanBelowData {
		const node = core.get_node(
			vector.add(pos, vector.create3d(0, -1, 0))
		).name;

		return {
			isAshPan: core.get_item_group(node, "ash_pan") > 0,
			isOpened: core.get_item_group(node, "opened") > 0,
		};
	}

	function ejectCoal(pos: Vec3): void {
		const param2 = core.get_node(pos).param2;
		if (param2 == null) {
			core.log(LogLevel.error, `Param2 dissapeared at ${pos}`);
			return;
		}

		const dir = vector.multiply(core.fourdir_to_dir(param2), -1);
		const outputPos = vector.add(pos, vector.multiply(dir, 0.6));

		// todo: particle spawner

		const entity = core.add_item(outputPos, "crafter:coal");
		if (entity == null) {
			core.log(LogLevel.error, `Player lost their coal at ${pos}`);
			return;
		}

		const vel = vector.create3d(
			dir.x == 0
				? math.random() * [-1, 1][math.random(0, 1)]
				: dir.x * math.random(),
			0,
			dir.z == 0
				? math.random() * [-1, 1][math.random(0, 1)]
				: dir.z * math.random()
		);

		entity.set_velocity(vel);
	}

	function manipulateFireEntity(pos: Vec3, entity: ObjectRef | null): void {
		if (entity == null) {
			// Cannot continue without an entity.
			core.log(LogLevel.warning, `Missing firebox entity at ${pos}`);
			return;
		}

		const fireboxData = utility.getMeta(pos, FireboxMeta);

		if (fireboxData.coalLevel <= 0) {
			entity.set_properties({
				visual_size: vector.create3d(0, 0, 0),
			});
		} else {
			entity.set_pos(
				vector.create3d(
					pos.x,
					pos.y - 0.5 + fireboxData.coalLevel / 2,
					pos.z
				)
			);
			entity.set_properties({
				visual_size: vector.create3d(
					fireEntityWidth,
					fireboxData.coalLevel,
					fireEntityWidth
				),
			});

			if (fireboxData.onFire) {
				entity.set_properties({
					textures: onFireTexturing,
					glow: 10,
				});
			} else {
				entity.set_properties({
					textures: coalTexturing,
					glow: 0,
				});
			}
		}
	}

	function doFireBoxLogic(pos: Vec3, opened: boolean): void {
		const fireboxData = utility.getMeta(pos, FireboxMeta);
		const hash = core.hash_node_position(pos);
		let soundHandle = fireBoxSounds.get(hash);

		const ashPanInfo = getIfAshPanBelow(pos);

		// Ashpan handling is extremely stream lined.
		// 3 reasons:
		// - This is taking a very long time.
		// - This is extremely complex.
		// - I do not want logic bugs.

		if (!ashPanInfo.isAshPan) {
			if (fireboxData.coalLevel > 0) {
				// All the on-fire coal turned into soot instantly.
				// todo: try to dump soot onto the ground.
				if (fireboxData.onFire) {
					fireboxData.onFire = false;
					fireboxData.coalLevel = 0;
				} else {
					// You might lose an item if floating point glitches out.
					const coalAmount = math.round(
						fireboxData.coalLevel / coalIncrement
					);
					const outputPos = vector.add(
						pos,
						vector.create3d(0, -0.6, 0)
					);
					let dropFailure = false;
					for (const _ of $range(1, coalAmount)) {
						const entity = core.add_item(outputPos, "crafter:coal");
						if (entity == null) {
							dropFailure = true;
							continue;
						}
						entity.set_velocity(
							vector.create3d(
								math.random() * [-1, 1][math.random(0, 1)],
								-math.random(),
								math.random() * [-1, 1][math.random(0, 1)]
							)
						);
					}
					if (dropFailure) {
						core.log(
							LogLevel.error,
							`Player lost their coal at ${pos}`
						);
					}

					fireboxData.coalLevel = 0;
				}
			}
			fireboxData.write();
		} else if (
			ashPanInfo.isAshPan &&
			ashPanInfo.isOpened &&
			fireboxData.coalLevel > 0
		) {
			if (fireboxData.coalLevel > 0) {
				if (fireboxData.onFire) {
					const posBelow = vector.add(pos, vector.create3d(0, -1, 0));
					const ashMeta = utility.getMeta(posBelow, AshPanMeta);

					// This allows for a weird hack where you can store a lit firebox by abusing
					// a full ash pan. But, I made it so the heat depletes 4 times as fast in this
					// state. You have completely snuffed out the air inlet to generate coal gas.

					let newDeposit = ashMeta.sootLevel + fireboxData.coalLevel;
					let remainder = 0;

					// Clean out your ash pan.
					if (newDeposit > 1.0) {
						remainder = newDeposit % 1.0;
						newDeposit = 1.0;
					}

					fireboxData.coalLevel = remainder;

					if (remainder == 0) {
						fireboxData.onFire = false;
						const hash = core.hash_node_position(pos);
						const id = fireBoxSounds.get(hash);

						if (id != null) {
							core.sound_stop(id);
							fireBoxSounds.delete(hash);
						}
					} else {
						fireboxData.temperature -=
							temperatureIncrementOpened * 2;
					}

					// If the soot level changed, update immediately.
					if (ashMeta.sootLevel != newDeposit) {
						core.get_node_timer(posBelow).set(0, 0);
					}

					ashMeta.sootLevel = newDeposit;

					ashMeta.write();
					fireboxData.write();
				} else {
					// This function will automatically eject coal at the opening.
					// This allows for some weird boiler setups.
					const coalAmount = math.round(
						fireboxData.coalLevel / coalIncrement
					);
					const posBelow = vector.add(pos, vector.create3d(0, -1, 0));
					for (const _ of $range(1, coalAmount)) {
						ejectCoal(posBelow);
					}
					fireboxData.coalLevel = 0;
					fireboxData.write();
				}
			}
		} else {
			if (fireboxData.onFire) {
				fireboxData.coalLevel -= opened
					? coalBurnRateOpened
					: coalBurnRateClosed;
				fireboxData.write();
				const soundLevel = opened
					? fireSoundLevelOpened
					: fireSoundLevelClosed;
				if (soundHandle == null) {
					soundHandle = core.sound_play("steam_firebox_on_fire", {
						pos: pos,
						pitch: (math.random(80, 99) + math.random()) / 100,
						gain: soundLevel,
						loop: true,
					});
					fireBoxSounds.set(hash, soundHandle);
				}
				core.sound_fade(soundHandle, 1, soundLevel);
				if (opened) {
					// This is a great way to blow up the boiler!
					if (fireboxData.temperature <= maxTempOpened) {
						fireboxData.temperature += temperatureIncrementOpened;
					}
				} else {
					if (fireboxData.temperature > maxTempClosed) {
						fireboxData.temperature -= temperatureDecrementClosed;
					} else if (
						fireboxData.temperature <= maxTempIncreasingClosed
					) {
						fireboxData.temperature += temperatureIncrementClosed;
					}
				}
				fireboxData.write();
			} else {
				if (fireboxData.temperature > 0) {
					// Basically this is the "oh shit I ran out of fuel" control.
					// If you close the doors the firebox will retain more heat.
					fireboxData.temperature -= opened
						? temperatureDecrementOpened
						: temperatureDecrementClosed;

					if (fireboxData.temperature < 0) {
						fireboxData.temperature = 0;
					}
					fireboxData.write();
				}
				if (soundHandle != null) {
					core.sound_stop(soundHandle);
				}
			}
			if (fireboxData.coalLevel < 0) {
				fireboxData.coalLevel = 0;
				fireboxData.onFire = false;
				fireboxData.write();

				// todo: drop down into the ash pan.
			}
		}
	}

	// todo: this should be detecting the (ash pan/grate) block to see if it was opened to dump the fire.

	// This is a really shitty marine firebox.
	const states = ["open", "closed"];
	for (const index of $range(0, 1)) {
		const currentState = states[index];
		core.register_node("crafter_steam:firebox_" + currentState, {
			drawtype: Drawtype.mesh,
			use_texture_alpha: TextureAlpha.clip,
			mesh: `steam_firebox_${currentState}.gltf`,
			tiles: ["steam_firebox.png", "steam_firebox_doors.png"],
			sunlight_propagates: true,
			paramtype: ParamType1.light,
			paramtype2: ParamType2["4dir"],
			groups: {
				stone: 2,
				firebox: 1,
				heat_vessel: 1,
				steam_duct_tape: 1,
			},
			sounds: crafter.stoneSound(),

			on_timer(position, elapsed) {
				doFireBoxLogic(position, index == 0);
				manipulateFireEntity(
					position,
					fireboxEntities.getOrCreate(position)
				);
				timerStart(position);
			},

			on_construct(position) {
				fireboxEntities.getOrCreate(position);
				timerStart(position);
			},

			on_rightclick(position, node, clicker, itemStack, pointedThing) {
				const fireboxData = utility.getMeta(position, FireboxMeta);

				const itemStackName = itemStack.get_name();

				if (
					currentState == "open" &&
					itemStackName == "crafter:coal" &&
					fireboxData.coalLevel < 0.6
				) {
					//? Add coal.

					// Requires an ash pan that's closed.

					const data = getIfAshPanBelow(position);

					if (!data.isAshPan) {
						return;
					}
					if (data.isOpened) {
						return;
					}

					// This is specifically designed to allow players to jam in above 0.6 as soon as the fire is lit.
					// Never change this. It's fun.
					itemStack.take_item();
					fireboxData.coalLevel += coalIncrement;
					fireboxData.write();
					manipulateFireEntity(
						position,
						fireboxEntities.getOrCreate(position)
					);
					core.sound_play("steam_coal_add", {
						pos: pointedThing.under!,
						pitch: (math.random(80, 99) + math.random()) / 100,
					});

					return itemStack;
				} else if (
					currentState == "open" &&
					!fireboxData.onFire &&
					core.get_item_group(itemStackName, "torch") > 0 &&
					fireboxData.coalLevel > 0
				) {
					//? Light with torch.
					itemStack.take_item();
					fireboxData.onFire = true;
					fireboxData.write();
					manipulateFireEntity(
						position,
						fireboxEntities.getOrCreate(position)
					);
					return itemStack;
				} else {
					//? Open/close doors.
					const newIndex = (index + 1) % 2;
					const newState = states[newIndex];
					core.swap_node(position, {
						name: "crafter_steam:firebox_" + newState,
						param2: node.param2,
					});
					core.sound_play("steam_boiler_door", {
						pos: pointedThing.under!,
						pitch: (math.random(80, 99) + math.random()) / 100,
					});
				}
			},

			on_destruct(position) {
				fireboxEntities.delete(position);

				const fireboxData = utility.getMeta(position, FireboxMeta);

				// If you lit this on fire, say goodbye to your coal.
				const amount = fireboxData.coalLevel / coalIncrement;

				if (!fireboxData.onFire) {
					if (amount > 0) {
						itemHandling.throw_item(
							position,
							`crafter:coal ${amount}`
						);
					}
				} else {
					// todo: throw ash
				}

				const hash = core.hash_node_position(position);
				const soundHandle = fireBoxSounds.get(hash);
				if (soundHandle != null) {
					core.sound_stop(soundHandle);
					fireBoxSounds.delete(hash);
				}
			},
		});
	}
}

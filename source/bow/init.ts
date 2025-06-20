namespace bow {
	// Luanti library.
	const get_connected_players = core.get_connected_players;
	const get_player_by_name = core.get_player_by_name;
	const get_objects_inside_radius = core.get_objects_inside_radius;
	const create_raycast = core.raycast;
	const dir_to_yaw = core.dir_to_yaw;
	const deserialize = core.deserialize;
	const serialize = core.serialize;

	// String library.
	const s_sub = string.sub;
	const s_len = string.len;

	// Math library.
	const pi = math.pi;
	const random = math.random;
	const floor = math.floor;

	// Vector library.
	const new_vec = vector.create3d;
	const floor_vec = vector.floor;
	const vec_distance = vector.distance;
	const normalize_vec = vector.normalize;
	const add_vec = vector.add;
	const sub_vec = vector.subtract;
	const multiply_vec = vector.multiply;
	const divide_vec = vector.divide;
	const vec_direction = vector.direction;

	// ██████╗ ██╗      █████╗ ██╗   ██╗███████╗██████╗     ██████╗  █████╗ ██████╗ ████████╗
	// ██╔══██╗██║     ██╔══██╗╚██╗ ██╔╝██╔════╝██╔══██╗    ██╔══██╗██╔══██╗██╔══██╗╚══██╔══╝
	// ██████╔╝██║     ███████║ ╚████╔╝ █████╗  ██████╔╝    ██████╔╝███████║██████╔╝   ██║
	// ██╔═══╝ ██║     ██╔══██║  ╚██╔╝  ██╔══╝  ██╔══██╗    ██╔═══╝ ██╔══██║██╔══██╗   ██║
	// ██║     ███████╗██║  ██║   ██║   ███████╗██║  ██║    ██║     ██║  ██║██║  ██║   ██║
	// ╚═╝     ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝    ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝

	interface BowData {
		index: number;
		step: number;
		float: number;
	}

	// Data pool.
	const pool = new Map<string, BowData>();

	// This is a very complicated function which makes the bow work.
	function arrow_check(name: string, delta: number): void {
		const player: ObjectRef | null = core.get_player_by_name(name);
		if (player == null) {
			return;
		}

		const data: BowData | undefined = pool.get(name);

		if (data == null) {
			throw new Error(`Player ${name} was never added to the pool.`);
		}

		const new_index: number = player.get_wield_index();
		const inv: InvRef | null = player.get_inventory();
		if (inv == null) {
			throw new Error("Not a player.");
		}

		// If player changes selected item.
		if (new_index != data.index) {
			inv.set_stack(
				"main",
				data.index,
				ItemStack("crafter_bow:bow_empty")
			);
			pool.delete(name);
			return;
		}

		const rightclick: boolean = player.get_player_control().RMB;

		// If player lets go of rightclick.
		if (data.step != 5 && !rightclick) {
			inv.set_stack(
				"main",
				data.index,
				ItemStack("crafter_bow:bow_empty")
			);
			pool.delete(name);
			return;
		}
		// If player isn't holding a bow.
		if (
			core.get_item_group(player.get_wielded_item().get_name(), "bow") ==
			0
		) {
			pool.delete(name);
			return;
		}

		// If player doesn't have any arrows.
		if (!inv.contains_item("main", ItemStack("crafter_bow:arrow"))) {
			inv.set_stack(
				"main",
				data.index,
				ItemStack("crafter_bow:bow_empty")
			);
			pool.delete(name);
			return;
		}
		// Count steps using delta.
		if (data.step < 5) {
			data.float += delta;
			if (data.float > 0.1) {
				data.float -= 0.1;
				data.step += 1;
				player.set_wielded_item(
					ItemStack("crafter_bow:bow_" + data.step)
				);
			}
		}

		if (data.step == 5 && !rightclick) {
			const dir: Vec3 = player.get_look_dir();
			const vel: Vec3 = multiply_vec(dir, 50);
			const pos: Vec3 = player.get_pos();
			pos.y += 1.5;
			const object: ObjectRef | null = core.add_entity(
				add_vec(pos, divide_vec(dir, 10)),
				"crafter_bow:arrow"
			);
			if (object != null) {
				object.set_velocity(vel);

				const entity: ArrowEntity | null =
					object.get_luaentity() as ArrowEntity | null;

				if (entity != null) {
					entity.owner = name;
					entity.oldpos = pos;
					core.sound_play("bow", {
						object: player,
						gain: 1.0,
						max_hear_distance: 60,
						pitch: random(80, 100) / 100,
					});
					inv.remove_item("main", ItemStack("crafter_bow:arrow"));
					inv.set_stack(
						"main",
						data.index,
						ItemStack("crafter_bow:bow_empty")
					);
				}
			}
			pool.delete(name);
		}

		//todo: add hand fatigue timer, make the camera shake.
		//todo: gradually increase fatigue until cap is reached
	}

	core.register_globalstep((delta: number) => {
		for (const name of pool.keys()) {
			arrow_check(name, delta);
		}
	});

	//  █████╗ ██████╗ ██████╗  ██████╗ ██╗    ██╗    ███████╗███╗   ██╗████████╗██╗████████╗██╗   ██╗
	// ██╔══██╗██╔══██╗██╔══██╗██╔═══██╗██║    ██║    ██╔════╝████╗  ██║╚══██╔══╝██║╚══██╔══╝╚██╗ ██╔╝
	// ███████║██████╔╝██████╔╝██║   ██║██║ █╗ ██║    █████╗  ██╔██╗ ██║   ██║   ██║   ██║    ╚████╔╝
	// ██╔══██║██╔══██╗██╔══██╗██║   ██║██║███╗██║    ██╔══╝  ██║╚██╗██║   ██║   ██║   ██║     ╚██╔╝
	// ██║  ██║██║  ██║██║  ██║╚██████╔╝╚███╔███╔╝    ███████╗██║ ╚████║   ██║   ██║   ██║      ██║
	// ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝  ╚══╝╚══╝     ╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚═╝   ╚═╝      ╚═╝

	class ArrowEntity extends types.Entity {
		initial_properties: ObjectProperties = {
			physical: true,
			collide_with_objects: false,
			collisionbox: [-0.05, -0.05, -0.05, 0.05, 0.05, 0.05],
			visual: EntityVisual.mesh,
			visual_size: { x: 1, y: 1 },
			mesh: "basic_bow_arrow.b3d",
			textures: ["basic_bow_arrow_uv.png"],
			pointable: false,
			//automatic_face_movement_dir : 0.0,
			//automatic_face_movement_max_rotation_per_sec : 600,
		};

		name: string = "crafter_bow:arrow";
		owner: string | null = null;
		oldpos: Vec3 | null = null;
		timer: number = 0;
		collecting: boolean = false;
		spin: number = 0;
		stuck: boolean = false;
		check_dir: Vec3 | null = null;
		readonly collection_height: number = 0.5;
		readonly radius: number = 2;

		on_step(delta: number, moveresult: MoveResult): void {
			this.timer += delta;
			if (this.timer >= 60) {
				this.object.remove();
				return;
			}
			const pos: Vec3 = this.object.get_pos();

			if (this.collecting) {
				if (this.owner == null) {
					core.log(
						LogLevel.warning,
						"Owner logic error! Owner was never set. Report my code to the nearest dumpster."
					);
					this.object.remove();
					return;
				}

				const owner: ObjectRef | null = get_player_by_name(this.owner);

				if (owner == null) {
					core.log(
						LogLevel.warning,
						`Player ${this.owner} disappeared. `
					);
					this.object.remove();
					return;
				}

				this.object.set_acceleration(new_vec(0, 0, 0));
				// Get the variables.
				const pos2: Vec3 = owner.get_pos();
				const player_velocity: Vec3 = owner.get_velocity();
				pos2.y += this.collection_height;
				const direction: Vec3 = normalize_vec(sub_vec(pos2, pos));
				let distance: number = vec_distance(pos2, pos);
				// Remove if too far away.
				if (distance > this.radius) {
					distance = 0;
				}
				const multiplier: number = this.radius * 5 - distance;
				let velocity: Vec3 = multiply_vec(direction, multiplier);
				velocity = add_vec(player_velocity, velocity);
				this.object.set_velocity(velocity);
				if (distance < 0.2) {
					this.object.remove();
				}
				return;
			} else {
				for (const [_, object] of ipairs(
					get_objects_inside_radius(pos, 2)
				)) {
					if (
						!this.stuck &&
						((object.is_player() &&
							object.get_player_name() != this.owner &&
							object.get_hp() > 0) ||
							(object.get_luaentity() &&
								(object.get_luaentity() as any)?.mobname)) // todo: cast this into a mob when the mob api is implemented.
					) {
						object.punch(this.object, 2, {
							full_punch_interval: 1.5,
							damage_groups: { damage: 3 },
						});
						this.object.remove();
						return;
					} else if (
						this.stuck &&
						this.timer > 1.0 &&
						object.is_player() &&
						object.get_player_name() == this.owner
					) {
						this.collecting = true;
						const inv: InvRef | null = object.get_inventory();
						if (inv == null) {
							throw new Error("Not a player.");
						}
						if (
							inv.room_for_item(
								"main",
								ItemStack("crafter_bow:arrow")
							)
						) {
							inv.add_item(
								"main",
								ItemStack("crafter_bow:arrow")
							);
							core.sound_play("pickup", {
								object: object,
								gain: 0.4,
								pitch: random(60, 100) / 100,
							});
						} else {
							this.object.remove();
							itemHandling.throw_item(pos, "crafter_bow:arrow");
						}
					}
				}

				if (
					moveresult &&
					moveresult.collides &&
					moveresult.collisions &&
					moveresult.collisions[0]?.new_velocity &&
					!this.stuck
				) {
					const collision: Collision = moveresult.collisions[0];
					if (
						collision.new_velocity.x == 0 &&
						collision.old_velocity.x != 0
					) {
						this.check_dir = vec_direction(
							new_vec(pos.x, 0, 0),
							new_vec(collision.node_pos.x, 0, 0)
						);
					} else if (
						collision.new_velocity.y == 0 &&
						collision.old_velocity.y != 0
					) {
						this.check_dir = vec_direction(
							new_vec(0, pos.y, 0),
							new_vec(0, collision.node_pos.y, 0)
						);
					} else if (
						collision.new_velocity.z == 0 &&
						collision.old_velocity.z != 0
					) {
						this.check_dir = vec_direction(
							new_vec(0, 0, pos.z),
							new_vec(0, 0, collision.node_pos.z)
						);
					}

					// print(dump(collision.new_pos));
					this.object.set_pos(collision.new_pos);

					// print(dump(collision.new_pos));
					core.sound_play("arrow_hit", {
						object: this.object,
						gain: 1,
						pitch: random(80, 100) / 100,
						max_hear_distance: 64,
					});
					this.stuck = true;
					this.object.set_velocity(new_vec(0, 0, 0));
					this.object.set_acceleration(new_vec(0, 0, 0));
				} else if (this.stuck == true && this.check_dir) {
					const pos2: Vec3 = add_vec(
						pos,
						multiply_vec(this.check_dir, 0.2)
					);
					const ray: RaycastObject = create_raycast(
						pos,
						pos2,
						false,
						false
					);
					if (ray.next() == null) {
						this.stuck = false;
						this.object.set_acceleration(new_vec(0, -9.81, 0));
					}
				}

				if (!this.stuck && this.oldpos) {
					this.spin += delta * 10;
					if (this.spin > pi) {
						this.spin = -pi;
					}
					const dir: Vec3 = normalize_vec(sub_vec(pos, this.oldpos));
					const y: number = dir_to_yaw(dir);
					const x: number =
						dir_to_yaw(
							new_vec(
								vec_distance(
									new_vec(pos.x, 0, pos.z),
									new_vec(this.oldpos.x, 0, this.oldpos.z)
								),
								0,
								pos.y - this.oldpos.y
							)
						) +
						pi / 2;
					this.object.set_rotation(new_vec(x, y, this.spin));
				}

				if (!this.stuck) {
					this.oldpos = pos;
				}
			}
		}

		on_activate(staticdata: string, delta_s: number): void {
			// this.object.set_animation({ x: 0, y: 180 }, 15, 0, true);

			let vel: Vec3 | null = null;
			if (s_sub(staticdata, 1, s_len("return")) == "return") {
				const data = deserialize(staticdata);
				if (data && typeof data == "object") {
					this.spin = data.spin;
					this.owner = data.owner;
					this.stuck = data.stuck;
					this.timer = data.timer;
					this.collecting = data.collecting;
					this.check_dir = data.check_dir;
					vel = data.vel;
				}
			}

			if (!this.stuck) {
				this.object.set_acceleration(new_vec(0, -9.81, 0));
				if (vel != null) {
					this.object.set_velocity(vel);
				}
			}
		}

		get_staticdata(): string {
			return serialize({
				spin: this.spin,
				owner: this.owner,
				stuck: this.stuck,
				timer: this.timer,
				collecting: this.collecting,
				check_dir: this.check_dir,
				vel: this.object.get_velocity(),
			});
		}
	}
	utility.registerTSEntity(ArrowEntity);

	// ██╗████████╗███████╗███╗   ███╗███████╗
	// ██║╚══██╔══╝██╔════╝████╗ ████║██╔════╝
	// ██║   ██║   █████╗  ██╔████╔██║███████╗
	// ██║   ██║   ██╔══╝  ██║╚██╔╝██║╚════██║
	// ██║   ██║   ███████╗██║ ╚═╝ ██║███████║
	// ╚═╝   ╚═╝   ╚══════╝╚═╝     ╚═╝╚══════╝

	function initialize_pullback(player: ObjectRef): void {
		const inv: InvRef | null = player.get_inventory();
		if (inv == null) {
			throw new Error("Not a player.");
		}
		if (inv.contains_item("main", ItemStack("crafter_bow:arrow"))) {
			const name = player.get_player_name();
			const newData: BowData = {
				index: player.get_wield_index(),
				float: 0,
				step: 0,
			};
			pool.set(name, newData);

			core.sound_play("bow_pull_back", {
				object: player,
				gain: 1.0,
				max_hear_distance: 60,
				pitch: random(70, 110) / 100,
			});
		}
	}

	core.register_craftitem("crafter_bow:bow_empty", {
		description: "Bow",
		inventory_image: "bow.png",
		stack_max: 1,
		groups: { bow: 1 },
		range: 0,

		on_secondary_use: (
			itemstack: ItemStackObject,
			user: ObjectRef,
			pointed_thing: PointedThing
		) => {
			initialize_pullback(user);
		},

		on_place: (
			itemstack: ItemStackObject,
			placer: ObjectRef,
			pointed_thing: PointedThing
		) => {
			initialize_pullback(placer);
		},
	});

	for (const i of $range(1, 5)) {
		core.register_craftitem("crafter_bow:bow_" + i, {
			description: "Bow",
			inventory_image: "bow_" + i + ".png",
			stack_max: 1,
			groups: { bow: 1, bow_loaded: i },
			range: 0,
			on_drop: (itemstack, dropper, pos) => {
				itemstack = ItemStack("crafter_bow:bow_empty");
				core.item_drop(itemstack, dropper, pos);
				return itemstack;
			},
		});
	}
	core.register_craftitem("crafter_bow:arrow", {
		description: "Arrow",
		inventory_image: "arrow_item.png",
	});

	//  ██████╗██████╗  █████╗ ███████╗████████╗██╗███╗   ██╗ ██████╗
	// ██╔════╝██╔══██╗██╔══██╗██╔════╝╚══██╔══╝██║████╗  ██║██╔════╝
	// ██║     ██████╔╝███████║█████╗     ██║   ██║██╔██╗ ██║██║  ███╗
	// ██║     ██╔══██╗██╔══██║██╔══╝     ██║   ██║██║╚██╗██║██║   ██║
	// ╚██████╗██║  ██║██║  ██║██║        ██║   ██║██║ ╚████║╚██████╔╝
	//  ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝        ╚═╝   ╚═╝╚═╝  ╚═══╝ ╚═════╝

	core.register_craft({
		output: "crafter_bow:bow_empty",
		recipe: [
			["", "crafter:stick", "crafter_mobs:string"],
			["crafter:stick", "", "crafter_mobs:string"],
			["", "crafter:stick", "crafter_mobs:string"],
		],
	});

	core.register_craft({
		output: "crafter_bow:arrow 16",
		recipe: [
			["crafter:iron", "", ""],
			["", "crafter:stick", ""],
			["", "", "crafter_mobs:feather"],
		],
	});
}

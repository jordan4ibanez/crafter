namespace utility {
	type constructorFunction = (pos: Vec3, entity: ObjectRef) => void;

	const debugClass = true;

	/**
	 *
	 * Please ensure that ``static_save`` is set to ``false`` for your entity.
	 *
	 * This class has 2 primary functions:
	 *
	 * 1.) It is compensating for nodes not having any animation properties.
	 * Yes, you can have a node with a mesh. But this is static. I do understand that
	 * this is a reasonably difficult thing to implement. So I am just rolling with it.
	 *
	 * 2.) It is compensating for entities not having UUIDs. So basically, the entity has to
	 * have ``static_save`` set to false. Unless you like having a very laggy game of course.
	 * There is no way to realistically track entities that are on disk but not in the world.
	 * I could probably do this, but, it would suffer from race conditions and all kinds of nonsense.
	 * People have been trying to stop UUIDs for entities from being implemented into the game.
	 * So if you think this is a shitty implementation, go argue with them in the IRC or Github issue
	 * tracker. Thank you for understanding.
	 *
	 * This class will do automatic type inferrence, so you only need to pass the class the entity class.
	 * The rest of the type information will be handled for you.
	 *
	 */
	export class NodeEntityContainer<T extends types.Entity> {
		private readonly minetestClassName: string;
		private readonly data: Map<number, ObjectRef>;
		private constructionFunction: constructorFunction = (
			pos: Vec3,
			entity: ObjectRef
		) => {};

		constructor(
			clazz: new () => T,
			entityConstructorFunction?: constructorFunction
		) {
			// Construct an instance because it needs the mt name, not ts.
			this.minetestClassName = new clazz().name;
			this.data = new Map<number, ObjectRef>();
			if (entityConstructorFunction != null) {
				this.constructionFunction = entityConstructorFunction;
			}
		}

		/**
		 * Get or create a node entity in the world.
		 * @param pos The position of the node entity.
		 * @returns An ObjectRef of the entity. Or, if everything completely fails, null.
		 */
		getOrCreate(pos: Vec3): ObjectRef | null {
			const hash = core.hash_node_position(pos);
			let entity = this.data.get(hash) || null;

			let hadToCreateEntity = false;

			// This entity does not exist, so create it.
			if (entity == null || !entity.is_valid()) {
				hadToCreateEntity = true;
				entity = core.add_entity(pos, this.minetestClassName);
				if (debugClass) {
					print(`Created new ${this.minetestClassName} at ${pos}`);
				}
				// Failed to create it.
				if (entity == null || !entity.is_valid()) {
					core.log(
						LogLevel.error,
						`Failed to add ${this.minetestClassName} entity at ${pos}`
					);
					return null;
				}
			}

			if (hadToCreateEntity) {
				if (debugClass) {
					print(
						`Triggered constructor function for ${this.minetestClassName} at ${pos}`
					);
				}
				this.constructionFunction(pos, entity);
				this.data.set(hash, entity);
			}

			return entity;
		}

		/**
		 * Delete a node entity from the world.
		 * @param pos The position of the node entity.
		 * @returns Nothing.
		 */
		delete(pos: Vec3): void {
			const hash = core.hash_node_position(pos);
			const entity = this.data.get(hash);
			if (entity == null) {
				return;
			}
			entity.remove();
			this.data.delete(hash);
		}
	}
}

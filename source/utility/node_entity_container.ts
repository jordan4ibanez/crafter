namespace utility {
	type constructorFunction = (pos: Vec3, entity: ObjectRef) => void;

	/**
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
	 */
	export class NodeEntityContainer<T extends types.Entity> {
		private readonly minetestClassName: string;
		private readonly data: Map<number, ObjectRef>;
		private constructionFunction: constructorFunction = () => {};

		constructor(
			clazz: new () => T,
			entityConstructorFunction?: () => void
		) {
			// Construct an instance because it needs the mt name, not ts.
			this.minetestClassName = new clazz().name;
			this.data = new Map<number, ObjectRef>();
			if (entityConstructorFunction != null) {
				this.constructionFunction = entityConstructorFunction;
			}
		}

		/**
		 * Get an entity from the data.
		 * @param pos The position of the node entity.
		 * @returns An ObjectRef of the entity. Or, if everything completely fails, null.
		 */
		get(pos: Vec3): ObjectRef | null {
			const hash = core.hash_node_position(pos);
			let entity = this.data.get(hash) || null;

			let hadToCreateEntity = false;

			// This entity does not exist, so create it.
			if (entity == null || !entity.is_valid()) {
				hadToCreateEntity = true;
				entity = core.add_entity(pos, this.minetestClassName);
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
				this.constructionFunction(pos, entity);
				this.data.set(hash, entity);
			}

			return entity;
		}
	}
}

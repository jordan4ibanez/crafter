namespace utility {
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
	 */
	export class NodeEntityContainer<T extends types.Entity> {



		constructor(clazz: new () => T) {

			const test = new clazz()
			print(test.name);
		}
	}
}

// local minetest,pairs = minetest,pairs
// Crafting recipes.

//? Cooking.
minetest.register_craft({
	type = "cooking",
	output = "main:diamond",
	recipe = "main:diamondore",
	cooktime = 12,
})
minetest.register_craft({
	type = "cooking",
	output = "main:coal 4",
	recipe = "main:coalore",
	cooktime = 3,
})
minetest.register_craft({
	type = "cooking",
	output = "main:charcoal",
	recipe = "main:tree",
	cooktime = 2,
})
minetest.register_craft({
	type = "cooking",
	output = "main:gold",
	recipe = "main:goldore",
	cooktime = 9,
})
minetest.register_craft({
	type = "cooking",
	output = "main:iron",
	recipe = "main:ironore",
	cooktime = 6,
})
minetest.register_craft({
	type = "cooking",
	output = "main:stone",
	recipe = "main:cobble",
	cooktime = 2,
})

minetest.register_craft({
	type = "cooking",
	output = "main:glass",
	recipe = "main:sand",
	cooktime = 1,
})


--fuel fuel fuel
minetest.register_craft({
	type = "fuel",
	recipe = "main:stick",
	burntime = 1,
})
minetest.register_craft({
	type = "fuel",
	recipe = "main:sapling",
	burntime = 1,
})
minetest.register_craft({
	type = "fuel",
	recipe = "main:paper",
	burntime = 1,
})
minetest.register_craft({
	type = "fuel",
	recipe = "main:tree",
	burntime = 24,
})
minetest.register_craft({
	type = "fuel",
	recipe = "main:wood",
	burntime = 12,
})
minetest.register_craft({
	type = "fuel",
	recipe = "main:leaves",
	burntime = 3,
})
minetest.register_craft({
	type = "fuel",
	recipe = "main:coal",
	burntime = 20,
})

minetest.register_craft({
	type = "fuel",
	recipe = "main:charcoal",
	burntime = 7,
})
---crafting
minetest.register_craft({
	type = "shapeless",
	output = "main:wood 4",
	recipe = {"main:tree"},
})
minetest.register_craft({
	type = "shapeless",
	output = "main:sugar 3",
	recipe = {"farming:sugarcane"},
})

minetest.register_craft({
	output = "main:stick 4",
	recipe = {
		{"main:wood"},
		{"main:wood"}
	}
})

minetest.register_craft({
	output = "main:paper",
	recipe = {
		{"farming:sugarcane","farming:sugarcane","farming:sugarcane"},
	}
})

local tool =     {"coal","wood","stone" ,"lapis","iron","gold","diamond","emerald","sapphire","ruby"}--the tool name
local material = {"coal","wood","cobble","lapis","iron","gold","diamond","emerald","sapphire","ruby"}--material to craft

for id,tool in pairs(tool) do

	
	minetest.register_craft({
		output = "main:"..tool.."pick",
		recipe = {
			{"main:"..material[id], "main:"..material[id], "main:"..material[id]},
			{"", "main:stick", ""},
			{"", "main:stick", ""}
		}
	})
	
	minetest.register_craft({
		output = "main:"..tool.."shovel",
		recipe = {
			{"","main:"..material[id], ""},
			{"", "main:stick", ""},
			{"", "main:stick", ""}
		}
	})
	
	minetest.register_craft({
		output = "main:"..tool.."axe",
		recipe = {
			{"main:"..material[id], "main:"..material[id], ""},
			{"main:"..material[id], "main:stick", ""},
			{"", "main:stick", ""}
		}
	})
	minetest.register_craft({
		output = "main:"..tool.."axe",
		recipe = {
			{"", "main:"..material[id], "main:"..material[id]},
			{"", "main:stick", "main:"..material[id]},
			{"", "main:stick", ""}
		}
	})
	
	minetest.register_craft({
		output = "main:"..tool.."sword",
		recipe = {
			{"","main:"..material[id], ""},
			{"","main:"..material[id], ""},
			{"", "main:stick", ""}
		}
	})
end

minetest.register_craft({
	output = "main:ladder 16",
	recipe = {
		{"main:stick","", "main:stick"},
		{"main:stick","main:stick", "main:stick"},
		{"main:stick", "", "main:stick"}
	}
})

minetest.register_craft({
	output = "main:shears",
	recipe = {
		{"","main:iron"},
		{"main:iron",""},
	}
})

minetest.register_craft({
	output = "main:bucket",
	recipe = {
		{"main:iron","","main:iron"},
		{"","main:iron",""},
	}
})

--tool repair
minetest.register_craft({
	type = "toolrepair",
	additional_wear = -0.02,
})



local raw_material = {"coal","lapis","iron","gold","diamond","emerald","sapphire","ruby"}
for _,name in pairs(raw_material) do
	minetest.register_craft({
		output = "main:"..name.."block",
		recipe = {
			{"main:"..name, "main:"..name, "main:"..name},
			{"main:"..name, "main:"..name, "main:"..name},
			{"main:"..name, "main:"..name, "main:"..name},
		}
	})
	minetest.register_craft({
		type = "shapeless",
		output = "main:"..name.." 9",
		recipe = {"main:"..name.."block"},
	})
end
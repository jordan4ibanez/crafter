--this is from https://github.com/HybridDog/builtin_item/blob/e6dfd9dce86503b3cbd1474257eca5f6f6ca71c2/init.lua#L50
local
minetest,vector,math,pairs
=
minetest,vector,math,pairs

local tab
local n
local function get_nodes(pos)
	tab,n = {},1
	for i = -1,1,2 do
		for _,p in pairs({
			{x=pos.x+i, y=pos.y, z=pos.z},
			{x=pos.x, y=pos.y, z=pos.z+i}
		}) do
			tab[n] = {p, minetest.get_node(p)}
			n = n+1
		end
	end
	return tab
end


local data
local param2
local nd
local par2
local name
local tmp
local c_node
local function get_flowing_dir(pos)
	c_node = minetest.get_node(pos).name
	if c_node ~= "main:waterflow" and c_node ~= "main:water" then
		return nil
	end
	data = get_nodes(pos)
	param2 = minetest.get_node(pos).param2
	if param2 > 7 then
		return nil
	end
	if c_node == "main:water" then
		for _,i in pairs(data) do
			nd = i[2]
			name = nd.name
			par2 = nd.param2
			if name == "main:waterflow" and par2 == 7 then
				return(vector.subtract(i[1],pos))
			end
		end
	end
	for _,i in pairs(data) do
		nd = i[2]
		name = nd.name
		par2 = nd.param2
		if name == "main:waterflow" and par2 < param2 then
			return(vector.subtract(i[1],pos))
		end
	end
	for _,i in pairs(data) do
		nd = i[2]
		name = nd.name
		par2 = nd.param2
		if name == "main:waterflow" and par2 >= 11 then
			return(vector.subtract(i[1],pos))
		end
	end
	for _,i in pairs(data) do
		nd = i[2]
		name = nd.name
		par2 = nd.param2
		tmp = minetest.registered_nodes[name]
		if tmp and not tmp.walkable and name ~= "main:waterflow" and name ~= "main:water" then
			return(vector.subtract(i[1],pos))
		end
	end

	return nil
end

function flow(pos)
	return(get_flowing_dir(pos))
end
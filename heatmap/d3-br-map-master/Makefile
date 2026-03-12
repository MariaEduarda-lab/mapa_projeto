all: build/br.json

clean:
	rm -rf build/

build/ne_50m_admin_1_states_provinces_lakes.zip:
	mkdir -p $(dir $@)
	curl -o $@ http://naciscdn.org/naturalearth/50m/cultural/$(notdir $@)

build/ne_50m_admin_1_states_provinces_lakes.shp: build/ne_50m_admin_1_states_provinces_lakes.zip
	unzip -od $(dir $@) $<
	touch $@

build/brasil.shp: build/ne_50m_admin_1_states_provinces_lakes.shp
	ogr2ogr -where "admin='Brazil'" $@ $< -lco ENCODING=UTF-8

build/br.json: build/brasil.shp
	topojson -o $@ \
		--id-property name \
		--filter=none \
		-p name -p postal \
		-- estados=$<

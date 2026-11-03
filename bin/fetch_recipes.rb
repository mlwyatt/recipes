# frozen_string_literal: true

require 'json'
require 'net/http'
require 'nokogiri'

if File.exist?('recipes/recipes_links.json')
  recipes_links = JSON.parse(File.read('recipes/recipes_links.json'), symbolize_names: true)
else
  recipes_links = []
  page = 1

  while true do
    uri = URI(['https://www.mealime.com', "recipes?page=#{page}"].join('/'))
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true

    request = Net::HTTP::Get.new(uri)
    response = http.request(request)

    if response.code.to_i != 200
      puts("Error fetching recipes: #{response.code} #{response.message}")
      exit 1
    end

    if response.body.match?(/no recipes match your search/i)
      puts('Finished')
      break
    end

    paged_recipes = Nokogiri::HTML(response.body)

    recipes_links += paged_recipes.css('a.css-izqw9f').map do |link|
      {
        path: link['href'],
        title: link.css('.css-110ngj5').text,
      }
    end
    page += 1
  end

  File.write('recipes/recipes_links.json', JSON.pretty_generate(recipes_links))
end

recipes_links.each do |recipe_data|
  uri = URI(['https://www.mealime.com', recipe_data[:path]].join(''))
  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = true

  title = recipe_data[:title]
  safe_title = title.gsub(/[^a-z\d]+/i, '_')
  request = Net::HTTP::Get.new(uri)
  response = http.request(request)

  if response.code.to_i != 200
    puts(uri)
    puts("Error fetching recipe #{title}: #{response.code} #{response.message}")
    exit 1
  end

  recipe = Nokogiri::HTML(response.body)
  data = JSON.parse(recipe.css('#__NEXT_DATA__').text)
  File.write("recipes/#{safe_title}.json", JSON.pretty_generate(data))
end

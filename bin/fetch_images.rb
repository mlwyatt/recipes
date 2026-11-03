# frozen_string_literal: true

require 'json'
require 'net/http'
require 'nokogiri'

Dir.glob('recipes/*.json').each do |file|
  data = JSON.parse(File.read(file))
  slug = data.dig('props', 'pageProps', 'publishedRecipe', 'slug') rescue nil
  image_url = data.dig('props', 'pageProps', 'publishedRecipe', 'presentation_image_url') rescue nil
  next if image_url.nil?

  uri = URI(image_url)
  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = true

  request = Net::HTTP::Get.new(uri)
  response = http.request(request)

  File.write("images/#{slug}.jpg", response.body)
end

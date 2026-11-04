# frozen_string_literal: true

require 'json'

Dir.glob('recipes/*.json').each do |file|
  data = JSON.parse(File.read(file))
  data = data.dig('props', 'pageProps', 'publishedRecipe') rescue nil
  next if data.nil?

  File.write(file, JSON.pretty_generate(data))
end

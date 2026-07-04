FactoryBot.define do
  factory :column do
    sequence(:name) { |n| "Column #{n}" }
    sequence(:position) { |n| n }
    project
  end
end

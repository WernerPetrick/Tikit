FactoryBot.define do
  factory :project do
    sequence(:name) { |n| "Project #{n}" }
    sequence(:key) { |n| "PRJ#{n}" }
    ticket_counter { 0 }
  end
end

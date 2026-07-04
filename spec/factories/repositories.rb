FactoryBot.define do
  factory :repository do
    sequence(:github_repo_id) { |n| 900_000 + n }
    sequence(:full_name) { |n| "acme/repo#{n}" }
    project
  end
end

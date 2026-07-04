FactoryBot.define do
  factory :user do
    sequence(:github_id) { |n| 1000 + n }
    sequence(:github_login) { |n| "user#{n}" }
    name { "Test User" }
    sequence(:email) { |n| "user#{n}@example.com" }
    avatar_url { "https://avatars.githubusercontent.com/u/1" }
  end
end

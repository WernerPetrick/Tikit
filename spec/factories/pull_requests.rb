FactoryBot.define do
  factory :pull_request do
    sequence(:github_pr_id) { |n| 50_000 + n }
    sequence(:pr_number) { |n| n }
    title { "Fix the thing" }
    state { "open" }
    sequence(:url) { |n| "https://github.com/acme/web/pull/#{n}" }
    author_login { "octocat" }
    repository
    ticket { nil }
  end
end

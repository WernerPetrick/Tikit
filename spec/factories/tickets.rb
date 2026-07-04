FactoryBot.define do
  factory :ticket do
    sequence(:title) { |n| "Ticket #{n}" }
    description { "" }
    category { "feature" }
    project
    column { association :column, project: project }
    reporter { association :user }
    assignee { nil }
    # ticket_number and position are auto-assigned by the model on create.

    trait :archived do
      archived_at { Time.current }
      archive_reason { "completed" }
      archived_by { association :user }
    end
  end
end

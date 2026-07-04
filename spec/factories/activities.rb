FactoryBot.define do
  factory :activity do
    subject { nil }
    actor_id { "" }
    action { "MyString" }
    metadata { "" }
  end
end

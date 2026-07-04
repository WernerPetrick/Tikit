class Activity < ApplicationRecord
  ACTIONS = %w[
    ticket_created ticket_moved ticket_reassigned ticket_archived
    ticket_restored pr_linked pr_state_changed
  ].freeze

  belongs_to :subject, polymorphic: true
  # nullable — webhook events have no human actor.
  belongs_to :actor, class_name: "User", optional: true

  validates :action, presence: true, inclusion: { in: ACTIONS }

  # Append-only / immutable: this stream is audit history and drives Discord
  # fan-out, so rows must never change after creation.
  before_update { raise ActiveRecord::ReadOnlyRecord, "Activity is append-only" }
  before_destroy { raise ActiveRecord::ReadOnlyRecord, "Activity is append-only" }

  # Discord fan-out runs from an after_create background job, never inline —
  # a Discord outage must not break the originating action. (Job added in Tier 1.)
  # after_create_commit { DiscordNotificationJob.perform_later(id) }
end

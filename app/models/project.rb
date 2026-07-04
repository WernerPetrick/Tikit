class Project < ApplicationRecord
  has_many :repositories, dependent: :destroy
  has_many :columns, -> { order(:position) }, dependent: :destroy, inverse_of: :project
  has_many :tickets, dependent: :destroy

  validates :name, presence: true
  validates :key, presence: true, uniqueness: true,
                  format: { with: /\A[A-Z][A-Z0-9]*\z/, message: "must be uppercase letters/digits" }

  before_validation :upcase_key

  # Race-safe per-project sequential ticket number allocation.
  # Increments ticket_counter atomically and returns the new value. Must run
  # inside the ticket-create transaction (see Ticket#assign_ticket_number).
  def next_ticket_number!
    with_lock do
      increment!(:ticket_counter)
      ticket_counter
    end
  end

  private

  def upcase_key
    self.key = key.upcase if key.present?
  end
end

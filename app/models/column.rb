class Column < ApplicationRecord
  belongs_to :project
  # Tickets keep their column even when archived (archived state is orthogonal).
  has_many :tickets, dependent: :restrict_with_exception

  validates :name, presence: true
  validates :position, presence: true

  # No enforced workflow transitions — "Done" is just a column with no special meaning.
end

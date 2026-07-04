class Repository < ApplicationRecord
  belongs_to :project
  has_many :pull_requests, dependent: :destroy

  # github_repo_id is the anchor — survives repo renames. full_name is display-only.
  validates :github_repo_id, presence: true, uniqueness: true
  validates :full_name, presence: true
end

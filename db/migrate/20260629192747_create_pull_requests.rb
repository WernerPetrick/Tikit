class CreatePullRequests < ActiveRecord::Migration[8.1]
  def change
    create_table :pull_requests do |t|
      t.bigint :github_pr_id, null: false
      t.integer :pr_number, null: false
      t.string :title
      t.string :state, null: false, default: "open"
      t.string :url
      t.string :author_login
      t.references :repository, null: false, foreign_key: true
      # nullable: a PR with no/malformed/dangling key is stored unlinked-but-visible
      t.references :ticket, null: true, foreign_key: true

      t.timestamps
    end

    add_index :pull_requests, :github_pr_id, unique: true
  end
end

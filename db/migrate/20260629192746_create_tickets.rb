class CreateTickets < ActiveRecord::Migration[8.1]
  def change
    create_table :tickets do |t|
      t.string :title, null: false
      t.text :description
      t.integer :ticket_number, null: false
      t.integer :position, null: false
      t.datetime :archived_at
      t.string :archive_reason
      t.text :archive_note
      t.references :project, null: false, foreign_key: true
      t.references :column, null: false, foreign_key: true
      t.references :reporter, null: false, foreign_key: { to_table: :users }
      t.references :assignee, null: true, foreign_key: { to_table: :users }
      t.references :archived_by, null: true, foreign_key: { to_table: :users }

      t.timestamps
    end

    # key = project.key + "-" + ticket_number; must be unique per project
    add_index :tickets, [:project_id, :ticket_number], unique: true
    # board ordering within a column
    add_index :tickets, [:column_id, :position]
    # per-project archive view
    add_index :tickets, :archived_at
  end
end

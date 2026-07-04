class CreateActivities < ActiveRecord::Migration[8.1]
  def change
    create_table :activities do |t|
      t.references :subject, polymorphic: true, null: false
      # nullable: webhook-driven events (e.g. pr_linked) have no human actor
      t.references :actor, null: true, foreign_key: { to_table: :users }
      t.string :action, null: false
      t.jsonb :metadata, null: false, default: {}

      t.timestamps
    end

    add_index :activities, :action
    add_index :activities, :created_at
  end
end

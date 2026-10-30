
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0003_skill_user_address_user_availability_and_more"),
        ("service_requests", "0001_initial"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql=[
                        """
                        ALTER TABLE service_requests_servicerequest
                        ADD COLUMN required_skill_id BIGINT NULL
                        """,
                        """
                        ALTER TABLE service_requests_servicerequest
                        ADD CONSTRAINT service_requests_ser_required_skill_id_e2daa874_fk_accounts_
                        FOREIGN KEY (required_skill_id)
                        REFERENCES accounts_skill (id)
                        """,
                    ],
                    reverse_sql=[
                        """
                        ALTER TABLE service_requests_servicerequest
                        DROP FOREIGN KEY service_requests_ser_required_skill_id_e2daa874_fk_accounts_
                        """,
                        """
                        ALTER TABLE service_requests_servicerequest
                        DROP COLUMN required_skill_id
                        """,
                    ],
                ),
            ],
            state_operations=[
                migrations.AddField(
                    model_name="servicerequest",
                    name="required_skill",
                    field=models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="service_requests",
                        to="accounts.skill",
                    ),
                ),
            ],
        ),
    ]

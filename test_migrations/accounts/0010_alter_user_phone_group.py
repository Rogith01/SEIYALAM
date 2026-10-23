
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0009_user_name"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.AlterField(
                    model_name="user",
                    name="phone_group",
                    field=models.CharField(
                        default="CUSTOMER",
                        editable=False,
                        max_length=8,
                    ),
                ),
            ],
        ),
    ]

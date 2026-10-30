
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0007_alter_user_role"),
        ("auth", "0012_alter_user_first_name_max_length"),
        ("companies", "0003_platformsettings"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="user",
            options={},
        ),
        migrations.AddField(
            model_name="user",
            name="phone_group",
            field=models.CharField(
                default="CUSTOMER",
                editable=False,
                max_length=8,
            ),
        ),
        migrations.AlterField(
            model_name="user",
            name="phone",
            field=models.CharField(
                blank=True,
                max_length=20,
                null=True,
            ),
        ),
        migrations.AddConstraint(
            model_name="user",
            constraint=models.UniqueConstraint(
                fields=("phone_group", "phone"),
                name="unique_phone_within_role_group",
            ),
        ),
    ]

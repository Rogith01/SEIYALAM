
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0001_initial"),
        ("companies", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="company",
            field=models.ForeignKey(
                to="companies.company",
                on_delete=django.db.models.deletion.CASCADE,
                related_name="users",
                blank=True,
                null=True,
                db_constraint=False,
            ),
        ),
        migrations.RunSQL(
            sql=(
                "ALTER TABLE `accounts_user` "
                "ADD CONSTRAINT `accounts_user_company_id_fk` "
                "FOREIGN KEY (`company_id`) "
                "REFERENCES `companies_company` (`id`)"
            ),
            reverse_sql=(
                "ALTER TABLE `accounts_user` "
                "DROP FOREIGN KEY `accounts_user_company_id_fk`"
            ),
        ),
    ]

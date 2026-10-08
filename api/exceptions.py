
from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is None:
        return response

    error_data = response.data

    # Extract a clean message from field validation errors
    if isinstance(error_data, dict):
            if "phone" in error_data:
                phone_error = error_data["phone"]
                error_message = (
                    phone_error[0]
                    if isinstance(phone_error, list)
                    else phone_error
                )

            elif "username" in error_data:
                username_error = error_data["username"]
                error_message = (
                    username_error[0]
                    if isinstance(username_error, list)
                    else username_error
                )

            elif "company" in error_data:
                company_error = error_data["company"]
                error_message = (
                    company_error[0]
                    if isinstance(company_error, list)
                    else company_error
                )
            elif "detail" in error_data:
                error_message = error_data["detail"]
            else:
                error_message = str(error_data)
    else:
                error_message = str(error_data)

    response.data = {
        "success": False,
        "status_code": response.status_code,
        "error": error_message,
    }

    return response

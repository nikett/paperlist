import streamlit as st
import pandas as pd

from google.oauth2 import service_account
from gspread_pandas import Spread, Client

from datetime import datetime


def get_param_value(param_name, app_state):
    q= ""
    if app_state:
        q = app_state.get(param_name, [])
        if isinstance(q, list):
            if len(q) > 0:
                q = q[0]
    return q

def extract_all_get_params():
    app_state = st.experimental_get_query_params()  # parse the query parameter.
    paper_id = get_param_value(param_name="paper_id", app_state=app_state)
    author_id = get_param_value(param_name="author_id", app_state=app_state)
    paper_title = get_param_value(param_name="paper_title", app_state=app_state)
    return {"paper_id": paper_id, "author_id": author_id, "paper_title": paper_title}

def update_data(sheetname, df, spread):
    col = ['paper_id', 'author_id', 'error_type', 'error_desc', 'paper_title', 'time_stamp']
    spread.df_to_sheet(df, sheet=sheetname, index=False, freeze_headers=True)
    return 'Error reported'

def setup_sheet_db():
    scope = ['https://spreadsheets.google.com/feeds',
             'https://www.googleapis.com/auth/drive']
    credentials = service_account.Credentials.from_service_account_info(
        st.secrets["gcp_service_account"], scopes = scope)
    client = Client(scope=scope, creds=credentials)
    # gc = gspread.service_account("secrets.json")
    spreadsheetname = "Reporting"
    # ns = client.create(spreadsheetname)
    spread = Spread(spreadsheetname, client = client)

    # spread.create_sheet(spreadsheetname)
    # spread.share('nikett@allenai.org', perm_type='user', role='writer')
    # Check the connection
    # st.write(spread.url)

    sh = client.open(spreadsheetname)
    worksheet_list = sh.worksheets()
    sheet = sh.worksheet('Reports')
    return {
        "spread": spread,
        "sheet": sheet
    }

if __name__ == '__main__':
    st.set_page_config(layout="wide")
    st.title('Paperlist error reporting')

    if "db" not in st.session_state:
        db = setup_sheet_db()
        st.session_state["db"] = db

    with st.form("reporting_form", clear_on_submit=True):
        params = extract_all_get_params()
        paper_id = params["paper_id"]
        author_id = params["author_id"]
        paper_title = params["paper_title"]

        st.write(paper_title)
        error_desc = st.selectbox(label="Error type", options=["Missing author", "something else todo"])
        error_type = st.text_area(label="The relevant change you want to make", )
        time_stamp = datetime.now()

        submit = st.form_submit_button("Submit")
        if submit:
            info = {'paper_id': [paper_id],
                    'author_id': [author_id],
                    'error_type': [error_type],
                    'error_desc': [error_desc],
                    'paper_title': [paper_title],
                    'time_stamp': [str(time_stamp)]
                    }
            report_df = pd.DataFrame(info)

            db = st.session_state["db"]
            df = pd.DataFrame(db["sheet"].get_all_records())
            updated_df = pd.concat([df, report_df], ignore_index=True)
            update_data(sheetname='Reports', df=updated_df, spread=db["spread"])



import streamlit as st
import pandas as pd

from google.oauth2 import service_account
from gspread_pandas import Spread, Client

from datetime import datetime

scope = ['https://spreadsheets.google.com/feeds', 
        'https://www.googleapis.com/auth/drive']

credentials = service_account.Credentials.from_service_account_info(
                    st.secrets["gcp_service_account"], scopes = scope)
client = Client(scope=scope, creds=credentials)
spreadsheetname = "Reporting"
spread = Spread(spreadsheetname, client = client)

# Check the connection
# st.write(spread.url)
 
sh = client.open(spreadsheetname)
worksheet_list = sh.worksheets()

def load_existing_data(sheetname):
    sheet = sh.worksheet(sheetname)
    df = DataFrame(sheet.get_all_records())
    return df

df = load_existing_data('Reports')

def update_data(sheetname, df):
    col = ['paper_id', 'reporter_id', 'error_type', 'time_stamp']
    spread.df_to_sheet(df[col], sheet=sheetname, index=False)
    st.info('Error reported')

st.header('Paperlist error reporting')

with st.form("reporting_form", clear_on_submit=True):
    paper_id = st.text_input("Enter the paper_id you want to report")
    reporter_id = st.text_input("Enter your Semantic Scholar ID")
    error_type = st.text_area("Describe the error, and the relevant change you want to make")
    time_stamp = datetime.now()

    submit = st.form_submit_button("Submit")
    if submit:
        info = {'paper_id': paper_id, 'reporter_id': reporter_id, 'error_type': error_type, 'time_stamp': time_stamp}
        report_df = pd.DataFrame(info)
        updated_df = df.append(info, ignore_index=True)
        update_data('Reports', updated_df)
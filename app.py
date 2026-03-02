import streamlit as st
import pandas as pd
import plotly.express as px

# --- PAGE SETUP ---
st.set_page_config(page_title="Uber Data Analyzer", layout="wide")
st.title("🚗 Ride-Share Data Analyzer")

# --- DATA LOADING & CLEANING ---
@st.cache_data
def load_data(uploaded_file):
    df = pd.read_csv(uploaded_file)
    
    # 1. Map internal Uber product names to friendly display names
    product_mapping = {
        'MOTO': 'Scooter',
        'Test.UberX Saver.3': 'UberX Saver',
        'UberX Saver': 'UberX Saver',
        '[B2C} Bus': 'Uber Bus',
        'uberX': 'UberX',
        'Comfort': 'Comfort',
        'Wait & Save 2': 'Wait & Save',
        'UberX Priority': 'UberX Priority',
        'Concentrix Shuttle': 'Concentrix Shuttle'
    }
    # Replace the internal names; if a new unknown name pops up in the future, it just keeps its original name
    df['product_type_name'] = df['product_type_name'].replace(product_mapping)
    
    # 2. Convert timestamps
    df['request_timestamp_local'] = pd.to_datetime(df['request_timestamp_local'], errors='coerce')
    df = df.dropna(subset=['request_timestamp_local'])
    df['date'] = df['request_timestamp_local'].dt.date
    
    # 3. Create a Month-Year column for the monthly table
    df['Month'] = df['request_timestamp_local'].dt.to_period('M').astype(str)
    
    # 4. Clean fares
    df['fare_amount'] = pd.to_numeric(df['fare_amount'], errors='coerce').fillna(0)
        
    return df

# --- FILE UPLOAD ---
uploaded_file = st.file_uploader("Upload your CSV file", type=["csv"])

if uploaded_file is not None:
    df = load_data(uploaded_file)

    # --- SIDEBAR FILTERS ---
    st.sidebar.header("Filter Your Data")
    
    # Date Filter
    min_date = df['date'].min()
    max_date = df['date'].max()
    date_range = st.sidebar.date_input("Date Range", [min_date, max_date], min_value=min_date, max_value=max_date)
    
    # Precise Status Filter
    known_statuses = ['completed', 'rider_canceled', 'unfulfilled']
    all_statuses = list(set(known_statuses + df['status'].dropna().unique().tolist()))
    selected_statuses = st.sidebar.multiselect("Trip Status", options=all_statuses, default=known_statuses)

    # Precise Product Type Filter (Now using the clean, mapped names)
    known_products = [
        'UberX', 'UberX Saver', 'Uber Bus', 'Scooter', 
        'Comfort', 'Wait & Save', 'UberX Priority', 'Concentrix Shuttle'
    ]
    # Combine mapped products with any unexpected ones to prevent future errors
    all_products = list(set(known_products + df['product_type_name'].dropna().unique().tolist()))
    selected_products = st.sidebar.multiselect("Product Type", options=all_products, default=known_products)

    # Apply Filters
    if len(date_range) == 2:
        start_date, end_date = date_range
    else:
        start_date, end_date = min_date, max_date

    mask = (
        (df['date'] >= start_date) & 
        (df['date'] <= end_date) &
        (df['status'].isin(selected_statuses)) &
        (df['product_type_name'].isin(selected_products))
    )
    filtered_df = df[mask]

    # --- MAIN UI ---
    if filtered_df.empty:
        st.warning("No data matches your filters.")
    else:
        currency = filtered_df['currency_code'].mode()[0] if not filtered_df['currency_code'].empty else "USD"

        # --- KEY METRICS ---
        st.subheader("💰 High-Level Summary")
        
        # Calculate the core metrics
        total_spend = filtered_df['fare_amount'].sum()
        total_trips = len(filtered_df)
        avg_spend = total_spend / total_trips if total_trips > 0 else 0
        
        # Display them in three neat columns
        col1, col2, col3 = st.columns(3)
        col1.metric("Total Spendings", f"{total_spend:,.2f} {currency}")
        col2.metric("Average Spending / Trip", f"{avg_spend:,.2f} {currency}")
        col3.metric("Total Trips", f"{total_trips:,}")
        
        st.divider()

        # --- MONTHLY ANALYSIS TABLE ---
        st.subheader("📅 Monthly Spending Analysis")
        
        # Group by Month, sum the fares, and count the trips
        monthly_summary = filtered_df.groupby('Month').agg(
            Total_Spent=('fare_amount', 'sum'),
            Total_Trips=('fare_amount', 'count')
        ).reset_index()
        
        # Format the numbers for better readability
        monthly_summary['Total_Spent'] = monthly_summary['Total_Spent'].apply(lambda x: f"{x:,.2f} {currency}")
        
        # Display as a clean, full-width table
        st.dataframe(monthly_summary, use_container_width=True, hide_index=True)

        st.divider()

        # --- CHARTS ---
        st.subheader("📊 Visual Breakdowns")
        col1, col2 = st.columns(2)
        
        with col1:
            # Spend by Product Type (Now uses the clean names!)
            spend_by_product = filtered_df.groupby('product_type_name')['fare_amount'].sum().reset_index()
            fig_prod = px.pie(
                spend_by_product, 
                values='fare_amount', 
                names='product_type_name', 
                title="Money Spent by Product Type",
                hole=0.4
            )
            st.plotly_chart(fig_prod, use_container_width=True)

        with col2:
            # Spend by Trip Status
            spend_by_status = filtered_df.groupby('status')['fare_amount'].sum().reset_index()
            fig_stat = px.bar(
                spend_by_status, 
                x='status', 
                y='fare_amount', 
                color='status',
                title="Money Spent by Trip Status"
            )
            st.plotly_chart(fig_stat, use_container_width=True)
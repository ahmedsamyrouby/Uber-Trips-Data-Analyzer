import streamlit as st
import pandas as pd
import plotly.express as px
import folium
from streamlit_folium import st_folium

# --- PAGE SETUP ---
st.set_page_config(page_title="Uber Data Analyzer", layout="wide")
st.title("🚗 Ride-Share Data Analyzer")


# --- DATA LOADING & CLEANING ---
@st.cache_data
def load_data(uploaded_file):
    df = pd.read_csv(uploaded_file)

    # 1. Map internal Uber product names to friendly display names
    product_mapping = {
        "MOTO": "Scooter",
        "Test.UberX Saver.3": "UberX Saver",
        "UberX Saver": "UberX Saver",
        "[B2C} Bus": "Uber Bus",
        "uberX": "UberX",
        "Comfort": "Comfort",
        "Wait & Save 2": "Wait & Save",
        "UberX Priority": "UberX Priority",
        "Concentrix Shuttle": "Concentrix Shuttle",
    }
    df["product_type_name"] = df["product_type_name"].replace(product_mapping)

    # 2. Convert timestamps
    df["request_timestamp_local"] = pd.to_datetime(
        df["request_timestamp_local"], errors="coerce"
    )
    df = df.dropna(subset=["request_timestamp_local"])
    df["date"] = df["request_timestamp_local"].dt.date
    df["Month"] = df["request_timestamp_local"].dt.to_period("M").astype(str)

    # 3. Clean numerical data
    df["fare_amount"] = pd.to_numeric(df["fare_amount"], errors="coerce").fillna(0)

    # Clean coordinates for the map
    coord_cols = [
        "begintrip_lat",
        "begintrip_lng",
        "dropoff_lat",
        "dropoff_lng",
        "request_lat",
        "request_lng",
    ]
    for col in coord_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    return df


# --- FILE UPLOAD ---
uploaded_file = st.file_uploader("Upload your CSV file", type=["csv"])

if uploaded_file is not None:
    df = load_data(uploaded_file)

    # --- SIDEBAR FILTERS ---
    st.sidebar.header("Filter Your Data")

    min_date, max_date = df["date"].min(), df["date"].max()
    date_range = st.sidebar.date_input(
        "Date Range", [min_date, max_date], min_value=min_date, max_value=max_date
    )

    known_statuses = ["completed", "rider_canceled", "unfulfilled"]
    all_statuses = list(set(known_statuses + df["status"].dropna().unique().tolist()))
    selected_statuses = st.sidebar.multiselect(
        "Trip Status", options=all_statuses, default=known_statuses
    )

    known_products = [
        "UberX",
        "UberX Saver",
        "Uber Bus",
        "Scooter",
        "Comfort",
        "Wait & Save",
        "UberX Priority",
        "Concentrix Shuttle",
    ]
    all_products = list(
        set(known_products + df["product_type_name"].dropna().unique().tolist())
    )
    selected_products = st.sidebar.multiselect(
        "Product Type", options=all_products, default=known_products
    )

    # Apply Filters
    start_date, end_date = date_range if len(date_range) == 2 else (min_date, max_date)

    mask = (
        (df["date"] >= start_date)
        & (df["date"] <= end_date)
        & (df["status"].isin(selected_statuses))
        & (df["product_type_name"].isin(selected_products))
    )
    filtered_df = df[mask]

    # --- MAIN UI ---
    if filtered_df.empty:
        st.warning("No data matches your filters.")
    else:
        currency = (
            filtered_df["currency_code"].mode()[0]
            if not filtered_df["currency_code"].empty
            else "USD"
        )

        # Create Tabs for better organization
        tab1, tab2 = st.tabs(["📊 Summary & Charts", "🗺️ Trip Explorer"])

        # ==========================================
        # TAB 1: SUMMARY & CHARTS
        # ==========================================
        with tab1:
            st.subheader("💰 High-Level Summary")

            total_spend = filtered_df["fare_amount"].sum()
            total_trips = len(filtered_df)
            avg_spend = total_spend / total_trips if total_trips > 0 else 0

            col1, col2, col3 = st.columns(3)
            col1.metric("Total Spendings", f"{total_spend:,.2f} {currency}")
            col2.metric("Average Spending / Trip", f"{avg_spend:,.2f} {currency}")
            col3.metric("Total Trips", f"{total_trips:,}")

            st.divider()

            st.subheader("📅 Monthly Spending Analysis")
            monthly_summary = (
                filtered_df.groupby("Month")
                .agg(
                    Total_Spent=("fare_amount", "sum"),
                    Total_Trips=("fare_amount", "count"),
                )
                .reset_index()
            )
            monthly_summary["Total_Spent"] = monthly_summary["Total_Spent"].apply(
                lambda x: f"{x:,.2f} {currency}"
            )
            st.dataframe(monthly_summary, use_container_width=True, hide_index=True)

            st.divider()

            st.subheader("📊 Visual Breakdowns")
            col_chart1, col_chart2 = st.columns(2)

            with col_chart1:
                spend_by_product = (
                    filtered_df.groupby("product_type_name")["fare_amount"]
                    .sum()
                    .reset_index()
                )
                fig_prod = px.pie(
                    spend_by_product,
                    values="fare_amount",
                    names="product_type_name",
                    title="Money Spent by Product Type",
                    hole=0.4,
                )
                st.plotly_chart(fig_prod, use_container_width=True)

            with col_chart2:
                spend_by_status = (
                    filtered_df.groupby("status")["fare_amount"].sum().reset_index()
                )
                fig_stat = px.bar(
                    spend_by_status,
                    x="status",
                    y="fare_amount",
                    color="status",
                    title="Money Spent by Trip Status",
                )
                st.plotly_chart(fig_stat, use_container_width=True)

        # ==========================================
        # TAB 2: TRIP EXPLORER & LEAFLET MAP
        # ==========================================
        with tab2:
            st.subheader("📋 Filtered Trips List")

            # Display a clean dataframe for the user to browse
            display_cols = [
                "request_timestamp_local",
                "product_type_name",
                "status",
                "fare_amount",
                "begintrip_address",
                "dropoff_address",
            ]
            # Only show columns that actually exist in the CSV
            display_cols = [col for col in display_cols if col in filtered_df.columns]
            st.dataframe(
                filtered_df[display_cols], use_container_width=True, hide_index=True
            )

            st.divider()

            st.subheader("🗺️ Interactive Trip Map")

            # Create a dropdown to select a specific trip
            trip_options = filtered_df.copy().reset_index()
            # Create a nice label for the dropdown menu
            trip_options["dropdown_label"] = (
                trip_options["request_timestamp_local"].dt.strftime("%Y-%m-%d %H:%M")
                + " | "
                + trip_options["product_type_name"]
                + " | "
                + trip_options["status"]
                + " | "
                + trip_options["fare_amount"].astype(str)
                + " "
                + currency
            )

            selected_idx = st.selectbox(
                "Select a specific trip to view its route on the map:",
                trip_options.index,
                format_func=lambda x: trip_options.loc[x, "dropdown_label"],
            )

            # Map generation logic
            if selected_idx is not None:
                trip_data = trip_options.loc[selected_idx]

                # Determine best coordinates (using begintrip, falling back to request)
                start_lat = (
                    trip_data["begintrip_lat"]
                    if pd.notna(trip_data.get("begintrip_lat"))
                    else trip_data.get("request_lat")
                )
                start_lng = (
                    trip_data["begintrip_lng"]
                    if pd.notna(trip_data.get("begintrip_lng"))
                    else trip_data.get("request_lng")
                )
                end_lat = trip_data.get("dropoff_lat")
                end_lng = trip_data.get("dropoff_lng")

                if pd.notna(start_lat) and pd.notna(start_lng):
                    # Initialize Leaflet map centered at pickup location
                    m = folium.Map(
                        location=[start_lat, start_lng],
                        zoom_start=13,
                        tiles="CartoDB positron",
                    )

                    # Add Pickup Marker (Green)
                    folium.Marker(
                        [start_lat, start_lng],
                        popup=f"Pickup: {trip_data.get('begintrip_address', 'Unknown')}",
                        tooltip="🟢 Pickup Location",
                        icon=folium.Icon(color="green", icon="play"),
                    ).add_to(m)

                    # Add Dropoff Marker (Red) and connect with a line if dropoff exists
                    if pd.notna(end_lat) and pd.notna(end_lng):
                        folium.Marker(
                            [end_lat, end_lng],
                            popup=f"Dropoff: {trip_data.get('dropoff_address', 'Unknown')}",
                            tooltip="� Dropoff Location",
                            icon=folium.Icon(color="red", icon="stop"),
                        ).add_to(m)

                        # Draw a line connecting pickup and dropoff
                        folium.PolyLine(
                            [[start_lat, start_lng], [end_lat, end_lng]],
                            color="blue",
                            weight=3,
                            opacity=0.7,
                            dash_array="10",
                        ).add_to(m)

                        # Adjust map bounds to fit both points
                        m.fit_bounds([[start_lat, start_lng], [end_lat, end_lng]])

                    # Render the map in Streamlit
                    st_folium(m, width=1200, height=500)
                else:
                    st.info(
                        "🗺️ GPS coordinates are not available for this specific trip (it may have been canceled before a driver was assigned)."
                    )

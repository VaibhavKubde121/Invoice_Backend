import { useState } from "react";
import axios from "axios";
import Card from "../Card";
import styles from "./form.module.scss";
import Grid from "../Grid";
import { Tooltip } from "react-tooltip";
import compLogo from "../../assets/company_logo.png";

const DEFAULT_CURRENCY = {
  code: "INR",
  name: "Rupee",
  symbol: "₹",
  country: "India",
};

const COMPANY_INFO = {
  name: "Rahul Gujar",
  address: "Hingahgaht, Maharashtra, India",
  phone: "+91-9021816598",
};

const ITEM_MAX_COUNT = 10;

export default function Form({ onSubmit }) {
  const [invoiceData, setInvoiceData] = useState({
    details: {
      companyLogo: compLogo,
      currency: DEFAULT_CURRENCY.code,
      invoiceNumber: "",
      invoiceDate: new Date().toISOString().substring(0, 10),
      billingName: "",
      billingPhone: "",
      billingAddress: "",
    },
    lineItems: [{ quantity: 1, description: "", price: 0.0 }],
  });

  const [isLoading, setIsLoading] = useState(false); // ✅ Loader state

  const { companyLogo } = invoiceData.details;

  const addLineItem = () => {
    setInvoiceData((prevState) => ({
      ...prevState,
      lineItems: [
        ...prevState.lineItems,
        { quantity: 1, description: "", price: 0.0 },
      ],
    }));
  };

  const removeLineItem = (index) => {
    const lineItems = [...invoiceData.lineItems];
    if (lineItems.length === 1) return;
    lineItems.splice(index, 1);
    setInvoiceData((prevState) => ({ ...prevState, lineItems }));
  };

  const handleOnchange = ({ target: { name, value } }, index) => {
    const details = { ...invoiceData.details };
    const lineItems = [...invoiceData.lineItems];

    if (details.hasOwnProperty(name)) {
      details[name] = value;
    } else {
      lineItems[index][name] = value;
    }

    setInvoiceData({ ...invoiceData, details, lineItems });
  };

  const handleOnSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); // Start loader

    const { billingName, billingPhone, billingAddress } = invoiceData.details;

    if (!billingName.trim() || !billingPhone.trim() || !billingAddress.trim()) {
      alert("Please fill all customer details.");
      setIsLoading(false);
      return;
    }

    for (const item of invoiceData.lineItems) {
      if (
        !item.description.trim() ||
        isNaN(item.quantity) ||
        isNaN(item.price)
      ) {
        alert("Please fill all line item fields properly.");
        setIsLoading(false);
        return;
      }
    }

    try {
      const formData = new FormData();
      if (invoiceData.details.companyLogo) {
        formData.append("companyLogo", invoiceData.details.companyLogo);
      }

      formData.append("invoiceData", JSON.stringify(invoiceData));

      await axios.post(
        `${import.meta.env.VITE_APP_BACKEND_URI}/create`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      try {
        const downloadRes = await axios.get(
          `${import.meta.env.VITE_APP_BACKEND_URI}/download`,
          { responseType: "blob" }
        );
        const blob = new Blob([downloadRes.data], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "invoice.pdf");
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (downloadErr) {
        alert("Invoice created, but failed to download PDF.");
      }

      setInvoiceData({
        details: {
          companyLogo: compLogo,
          currency: DEFAULT_CURRENCY.code,
          invoiceNumber: "",
          invoiceDate: new Date().toISOString().substring(0, 10),
          billingName: "",
          billingPhone: "",
          billingAddress: "",
        },
        lineItems: [{ quantity: 1, description: "", price: 0.0 }],
      });
    } catch (err) {
      console.error("Error:", err);
      alert("Error creating invoice");
    } finally {
      setIsLoading(false); // Stop loader
    }
  };

  const handleResetInvoice = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_APP_BACKEND_URI}/reset-invoice-count`
      );
      alert("Invoice number has been reset to INV-0");
    } catch (err) {
      alert("Failed to reset invoice number");
    }
  };

  const Loader = () => (
    <div
      style={{
        textAlign: "center",
        padding: "30px",
        fontSize: "16px",
        color: "#444",
      }}
    >
      <div
        style={{
          display: "inline-block",
          width: "30px",
          height: "30px",
          border: "4px solid #ccc",
          borderTop: "4px solid #333",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          marginBottom: "10px",
        }}
      ></div>
      <p>Generating PDF, please wait...</p>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );

  return (
    <Card>
      {isLoading ? (
        <Loader />
      ) : (
        <form className={styles.form} onSubmit={handleOnSubmit}>
          <Grid>
            <div className={styles.invoice_details}>
              <h2>Company Info</h2>
              <div className={styles.company_info}>
                <img
                  className={styles.company_logo}
                  src={companyLogo}
                  alt="Company Logo"
                />
                <div className={styles.company_details}>
                  <p className={styles.company_name}>{COMPANY_INFO.name}</p>
                  <p className={styles.company_address}>
                    {COMPANY_INFO.address}
                  </p>
                  <p className={styles.company_phone}>
                    📞 {COMPANY_INFO.phone}
                  </p>
                </div>
              </div>

              <fieldset>
                <legend>Invoice</legend>
                <div className={styles.input_group}>
                  <div>
                    <label htmlFor="invoiceNumber">Invoice number</label>
                    <input
                      type="text"
                      id="invoiceNumber"
                      name="invoiceNumber"
                      value={invoiceData.details.invoiceNumber}
                      readOnly
                      placeholder="Will auto-generate"
                    />
                  </div>
                  <div>
                    <label htmlFor="invoiceDate">Invoice date</label>
                    <input
                      type="date"
                      id="invoiceDate"
                      name="invoiceDate"
                      value={invoiceData.details.invoiceDate}
                      onChange={handleOnchange}
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset>
                <legend>Bill To</legend>
                <div className={styles.input_group}>
                  <div>
                    <label htmlFor="billingName">Customer name</label>
                    <input
                      type="text"
                      id="billingName"
                      name="billingName"
                      placeholder="Customer name"
                      value={invoiceData.details.billingName}
                      onChange={handleOnchange}
                    />
                  </div>
                  <div>
                    <label htmlFor="billingPhone">Customer No.</label>
                    <input
                      type="tel"
                      id="billingPhone"
                      name="billingPhone"
                      placeholder="Customer number"
                      value={invoiceData.details.billingPhone}
                      onChange={handleOnchange}
                    />
                  </div>
                  <div>
                    <label htmlFor="billingAddress">Customer address</label>
                    <input
                      type="text"
                      id="billingAddress"
                      name="billingAddress"
                      placeholder="Customer address"
                      value={invoiceData.details.billingAddress}
                      onChange={handleOnchange}
                    />
                  </div>
                </div>
              </fieldset>
            </div>

            <div className={styles.invoice_items}>
              <h2>Items List</h2>
              {invoiceData.lineItems.map((item, index) => (
                <div key={index} className={styles.item}>
                  <input
                    data-tooltip-id={`input-${index}`}
                    data-tooltip-content="Quantity"
                    type="number"
                    min="1"
                    name="quantity"
                    placeholder="Quantity"
                    value={item.quantity}
                    onChange={(e) => handleOnchange(e, index)}
                  />
                  <input
                    data-tooltip-id={`input-${index}`}
                    data-tooltip-content="Description"
                    type="text"
                    name="description"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => handleOnchange(e, index)}
                  />
                  <input
                    data-tooltip-id={`input-${index}`}
                    data-tooltip-content="Price"
                    type="number"
                    min="1"
                    step=".01"
                    name="price"
                    placeholder="Price"
                    value={item.price}
                    onChange={(e) => handleOnchange(e, index)}
                  />
                  <Tooltip id={`input-${index}`} />
                  <button type="button" onClick={() => removeLineItem(index)}>
                    -
                  </button>
                </div>
              ))}
              {invoiceData.lineItems.length < ITEM_MAX_COUNT && (
                <button type="button" onClick={addLineItem}>
                  Add item +
                </button>
              )}
            </div>
          </Grid>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "10px",
              marginTop: "20px",
            }}
          >
            <button type="submit">Create & Download</button>
            <button
              type="button"
              onClick={handleResetInvoice}
              style={{ backgroundColor: "red", color: "white" }}
            >
              Reset Invoice No.
            </button>
          </div>
        </form>
      )}
    </Card>
  );
}

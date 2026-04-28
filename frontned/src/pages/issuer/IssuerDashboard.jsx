import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import toast from "react-hot-toast";
import {
  Spinner,
  EmptyState,
  Badge,
  SectionHeader,
  PageHeader,
  Field,
  InfoRow,
  Alert,
  Divider,
  CopyBtn,
} from "../../components/ui/index";
import {
  FiSend,
  FiUser,
  FiFileText,
  FiCheck,
  FiList,
  FiRefreshCw,
  FiX,
  FiUsers,
  FiClock,
  FiSearch,
  FiChevronDown,
  FiActivity,
  FiShield,
  FiHash,
  FiCalendar,
  FiAlertCircle,
  FiDroplet,
  FiArchive,
} from "react-icons/fi";

// ============================================================
// Random Data Generator
// ============================================================
const randomNames = [
  "Aarav Sharma",
  "Vihaan Gupta",
  "Vivaan Kumar",
  "Ananya Singh",
  "Diya Verma",
  "Advik Reddy",
  "Kabir Nair",
  "Sai Patel",
  "Ishaan Joshi",
  "Myra Kapoor",
  "Reyansh Malhotra",
  "Aadhya Mehra",
  "Anvi Choudhary",
  "Shaurya Khanna",
  "Ishita Bansal",
];

const randomStates = [
  "Maharashtra",
  "Delhi",
  "Karnataka",
  "Tamil Nadu",
  "Gujarat",
  "Uttar Pradesh",
  "West Bengal",
  "Rajasthan",
  "Telangana",
  "Kerala",
];

const randomCitizenship = [
  "citizen",
  "permanent resident",
  "non-citizen",
  "visa",
];
const randomEducation = ["high school", "bachelor", "master", "phd", "diploma"];
const randomMarital = ["single", "married", "divorced", "widowed"];
const randomGenders = ["male", "female", "other"];

const generateRandomId = (prefix, length = 8) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}${result}`;
};

const generateRandomData = () => ({
  basic: {
    full_name: "Test User",
    gender: Math.random() > 0.5 ? "male" : "female",
    state: "Odisha",
  },

  attributes: {
    age: Math.floor(Math.random() * 40) + 18,
    citizenship_status: "citizen",
    education_level: "high school",
    marital_status: Math.random() > 0.5 ? "married" : "single",
    license_validity: true,
    tax_compliance: true,
  },

  identifiers: {
    // ✅ always valid formats
    aadhaar_number: String(
      Math.floor(100000000000 + Math.random() * 900000000000),
    ), // 12 digits
    pan_number: "ABCDE" + Math.floor(1000 + Math.random() * 9000) + "F", // AAAAA9999A
    voter_id: "ABC" + Math.floor(1000000 + Math.random() * 9000000), // ABC1234567
    driving_license:
      "DL01" + Math.floor(1000000000 + Math.random() * 9000000000),
    passport_number: "A" + Math.floor(1000000 + Math.random() * 9000000),
    ration_card_number:
      "RC" + Math.floor(1000000000 + Math.random() * 9000000000),
  },
});
// ============================================================
// Issue Credential Form Component
// ============================================================
function IssueForm() {
  const [form, setForm] = useState({
    holder_id: "",
    credential_type: "identity",
    basic: {
      full_name: "",
      gender: "",
      state: "",
    },
    attributes: {
      age: 0,
      citizenship_status: "",
      education_level: "",
      marital_status: "",
      license_validity: false,
      tax_compliance: false,
    },
    identifiers: {
      aadhaar_number: "",
      pan_number: "",
      voter_id: "",
      driving_license: "",
      passport_number: "",
      ration_card_number: "",
    },
  });

  const [holders, setHolders] = useState([]);
  const [loadingHolders, setLoadingHolders] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchHolders();
  }, []);

  const fetchHolders = async () => {
    setLoadingHolders(true);
    try {
      const response = await api.get("/issuer/holders");
      setHolders(response.data);
    } catch (error) {
      toast.error("Failed to load holders");
    } finally {
      setLoadingHolders(false);
    }
  };

  const updateBasic = (key, value) => {
    setForm((prev) => ({ ...prev, basic: { ...prev.basic, [key]: value } }));
  };

  const updateAttribute = (key, value) => {
    setForm((prev) => ({
      ...prev,
      attributes: { ...prev.attributes, [key]: value },
    }));
  };

  const updateIdentifier = (key, value) => {
    setForm((prev) => ({
      ...prev,
      identifiers: { ...prev.identifiers, [key]: value },
    }));
  };

  const fillRandomData = () => {
    const randomData = generateRandomData();
    setForm((prev) => ({
      ...prev,
      basic: randomData.basic,
      attributes: randomData.attributes,
      identifiers: randomData.identifiers,
    }));
    toast.success("Random test data generated");
  };

  const selectHolder = (holder) => {
    setForm((prev) => ({ ...prev, holder_id: holder.public_id }));
    setSearchTerm(`${holder.name} (${holder.email})`);
    setShowDropdown(false);
  };

  const clearHolder = () => {
    setForm((prev) => ({ ...prev, holder_id: "" }));
    setSearchTerm("");
    setShowDropdown(false);
  };

  const filteredHolders = holders.filter(
    (holder) =>
      holder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      holder.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      holder.public_id.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const submit = async (e) => {
    e.preventDefault();

    if (!form.holder_id) {
      toast.error("Please select a holder");
      return;
    }

    // Validate required fields
    if (!form.basic.full_name || !form.basic.gender || !form.basic.state) {
      toast.error("Please fill all required basic fields");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        holder_id: form.holder_id,
        credential_type: form.credential_type,
        basic: {
          full_name: form.basic.full_name,
          gender: form.basic.gender,
          state: form.basic.state,
        },
        attributes: {
          age: form.attributes.age || 0,
          citizenship_status: form.attributes.citizenship_status || "",
          education_level: form.attributes.education_level || "",
          marital_status: form.attributes.marital_status || "",
          license_validity: form.attributes.license_validity,
          tax_compliance: form.attributes.tax_compliance,
        },
        identifiers: {
          aadhaar_number: form.identifiers.aadhaar_number || null,
          pan_number: form.identifiers.pan_number || null,
          voter_id: form.identifiers.voter_id || null,
          driving_license: form.identifiers.driving_license || null,
          passport_number: form.identifiers.passport_number || null,
          ration_card_number: form.identifiers.ration_card_number || null,
        },
      };

      await api.post("/issuer/issue", payload);

      toast.success("Credential issued and anchored on-chain");
      setSuccess(true);

      // Reset form
      setForm({
        holder_id: "",
        credential_type: "identity",
        basic: { full_name: "", gender: "", state: "" },
        attributes: {
          age: 0,
          citizenship_status: "",
          education_level: "",
          marital_status: "",
          license_validity: false,
          tax_compliance: false,
        },
        identifiers: {
          aadhaar_number: "",
          pan_number: "",
          voter_id: "",
          driving_license: "",
          passport_number: "",
          ration_card_number: "",
        },
      });
      setSearchTerm("");
      setShowDropdown(false);

      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      const errorMsg =
        e.response?.data?.detail ||
        e.response?.data?.message ||
        "Issuance failed";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const selectedHolder = holders.find((h) => h.public_id === form.holder_id);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 24,
        }}>
        <PageHeader
          title="Issue Credential"
          subtitle="Encrypt and anchor identity data to the blockchain"
          icon={<FiSend size={18} />}
          color="var(--c-issuer)"
        />
        <button
          type="button"
          onClick={fillRandomData}
          className="btn-ghost btn-sm"
          style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <FiDroplet size={14} />
          Generate Random Data
        </button>
      </div>

      <form
        onSubmit={submit}
        className="card"
        style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "24px" }}>
          {/* Holder Selection Section */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ marginBottom: 6 }}>
              <span
                className="label"
                style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <FiUsers size={11} />
                SELECT HOLDER
                <span style={{ color: "var(--c-red)", fontSize: 12 }}>*</span>
              </span>
            </div>
            <div style={{ position: "relative" }}>
              <div style={{ position: "relative" }}>
                <FiSearch
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                    zIndex: 1,
                    pointerEvents: "none",
                  }}
                  size={14}
                />
                <input
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowDropdown(true);
                    if (!e.target.value) {
                      setForm((prev) => ({ ...prev, holder_id: "" }));
                    }
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Search by name, email, or public ID..."
                  className="input"
                  style={{ paddingLeft: 36, paddingRight: 70 }}
                />
                <div
                  style={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    display: "flex",
                    gap: 4,
                  }}>
                  {form.holder_id && (
                    <button
                      type="button"
                      onClick={clearHolder}
                      style={{
                        padding: 4,
                        borderRadius: 4,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--text-muted)",
                      }}>
                      <FiX size={14} />
                    </button>
                  )}
                  <FiChevronDown
                    style={{
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      transition: "transform 0.2s",
                      transform: showDropdown ? "rotate(180deg)" : "none",
                    }}
                    size={14}
                    onClick={() => setShowDropdown(!showDropdown)}
                  />
                </div>
              </div>

              {showDropdown && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    left: 0,
                    right: 0,
                    background: "rgba(20,20,25,0.98)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 10,
                    zIndex: 9999,
                    maxHeight: 280,
                    overflowY: "auto",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
                  }}>
                  {filteredHolders.map((holder) => (
                    <button
                      key={holder.public_id}
                      type="button"
                      onClick={() => selectHolder(holder)}
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        textAlign: "left",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(255,255,255,0.05)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 13,
                          color: "#fff",
                        }}>
                        {holder.name}
                      </div>
                      <div style={{ fontSize: 11, color: "#aaa" }}>
                        {holder.email}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "#4ade80",
                          fontFamily: "monospace",
                        }}>
                        {holder.public_id}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedHolder && (
              <div style={{ marginTop: 10 }}>
                <Alert variant="success" title="Holder Selected">
                  {selectedHolder.name} · {selectedHolder.public_id}
                </Alert>
              </div>
            )}
          </div>

          {/* Credential Type */}
          <div style={{ marginBottom: 24 }}>
            <Field
              label="CREDENTIAL TYPE"
              required>           
              <select
                value={form.credential_type}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    credential_type: e.target.value,
                  }))
                }
                className="input"
                style={{ appearance: "auto" }}>
                <option value="identity">Identity Credential</option>
                <option value="financial">Financial Credential</option>
                <option value="education">Education Credential</option>
                <option value="professional">Professional Credential</option>
              </select>
            </Field>
          </div>

          <Divider label="BASIC INFORMATION" />

          {/* Basic Information Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 16,
              marginBottom: 24,
            }}>
            <Field label="FULL NAME" required>
              <input
                value={form.basic.full_name}
                onChange={(e) => updateBasic("full_name", e.target.value)}
                placeholder="Enter full name"
                className="input"
              />
            </Field>

            <Field label="GENDER" required>
              <select
                value={form.basic.gender}
                onChange={(e) => updateBasic("gender", e.target.value)}
                className="input"
                style={{ appearance: "auto" }}>
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </Field>

            <Field label="STATE" required>
              <input
                value={form.basic.state}
                onChange={(e) => updateBasic("state", e.target.value)}
                placeholder="State of residence"
                className="input"
              />
            </Field>
          </div>

          <Divider label="ATTRIBUTES & VERIFICATIONS" />

          {/* Attributes Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 16,
              marginBottom: 20,
            }}>
            <Field label="AGE">
              <input
                type="number"
                value={form.attributes.age || ""}
                onChange={(e) =>
                  updateAttribute("age", parseInt(e.target.value) || 0)
                }
                placeholder="Age"
                className="input"
              />
            </Field>

            <Field label="CITIZENSHIP STATUS">
              <select
                value={form.attributes.citizenship_status}
                onChange={(e) =>
                  updateAttribute("citizenship_status", e.target.value)
                }
                className="input"
                style={{ appearance: "auto" }}>
                <option value="">Select Status</option>
                <option value="citizen">Citizen</option>
                <option value="permanent resident">Permanent Resident</option>
                <option value="non-citizen">Non-Citizen</option>
                <option value="visa">Visa Holder</option>
              </select>
            </Field>

            <Field label="EDUCATION LEVEL">
              <select
                value={form.attributes.education_level}
                onChange={(e) =>
                  updateAttribute("education_level", e.target.value)
                }
                className="input"
                style={{ appearance: "auto" }}>
                <option value="">Select Level</option>
                <option value="high school">High School</option>
                <option value="bachelor">Bachelor's Degree</option>
                <option value="master">Master's Degree</option>
                <option value="phd">PhD</option>
                <option value="diploma">Diploma</option>
              </select>
            </Field>

            <Field label="MARITAL STATUS">
              <select
                value={form.attributes.marital_status}
                onChange={(e) =>
                  updateAttribute("marital_status", e.target.value)
                }
                className="input"
                style={{ appearance: "auto" }}>
                <option value="">Select Status</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
              </select>
            </Field>
          </div>

          {/* Boolean Toggles */}
          <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
            <button
              type="button"
              onClick={() =>
                updateAttribute(
                  "license_validity",
                  !form.attributes.license_validity,
                )
              }
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                borderRadius: 8,
                border: `1px solid ${form.attributes.license_validity ? "rgba(74,222,128,0.4)" : "var(--border-medium)"}`,
                background: form.attributes.license_validity
                  ? "rgba(74,222,128,0.1)"
                  : "transparent",
                color: form.attributes.license_validity
                  ? "var(--c-green)"
                  : "var(--text-secondary)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}>
              <span style={{ fontSize: 12, fontWeight: 500 }}>
                Driving License Valid
              </span>
              {form.attributes.license_validity ? (
                <FiCheck size={14} />
              ) : (
                <FiX size={14} />
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                updateAttribute(
                  "tax_compliance",
                  !form.attributes.tax_compliance,
                )
              }
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                borderRadius: 8,
                border: `1px solid ${form.attributes.tax_compliance ? "rgba(74,222,128,0.4)" : "var(--border-medium)"}`,
                background: form.attributes.tax_compliance
                  ? "rgba(74,222,128,0.1)"
                  : "transparent",
                color: form.attributes.tax_compliance
                  ? "var(--c-green)"
                  : "var(--text-secondary)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}>
              <span style={{ fontSize: 12, fontWeight: 500 }}>
                Tax Compliant
              </span>
              {form.attributes.tax_compliance ? (
                <FiCheck size={14} />
              ) : (
                <FiX size={14} />
              )}
            </button>
          </div>

          <Divider label="GOVERNMENT IDENTIFIERS (OPTIONAL)" />

          {/* Identifiers Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 16,
              marginBottom: 28,
            }}>
            <Field label="AADHAAR NUMBER">
              <input
                value={form.identifiers.aadhaar_number}
                onChange={(e) =>
                  updateIdentifier("aadhaar_number", e.target.value)
                }
                placeholder="12-digit Aadhaar number"
                className="input"
              />
            </Field>

            <Field label="PAN NUMBER">
              <input
                value={form.identifiers.pan_number}
                onChange={(e) => updateIdentifier("pan_number", e.target.value)}
                placeholder="10-digit PAN number"
                className="input"
              />
            </Field>

            <Field label="VOTER ID">
              <input
                value={form.identifiers.voter_id}
                onChange={(e) => updateIdentifier("voter_id", e.target.value)}
                placeholder="Voter ID number"
                className="input"
              />
            </Field>

            <Field label="DRIVING LICENSE">
              <input
                value={form.identifiers.driving_license}
                onChange={(e) =>
                  updateIdentifier("driving_license", e.target.value)
                }
                placeholder="Driving license number"
                className="input"
              />
            </Field>

            <Field label="PASSPORT NUMBER">
              <input
                value={form.identifiers.passport_number}
                onChange={(e) =>
                  updateIdentifier("passport_number", e.target.value)
                }
                placeholder="Passport number"
                className="input"
              />
            </Field>

            <Field label="RATION CARD NUMBER">
              <input
                value={form.identifiers.ration_card_number}
                onChange={(e) =>
                  updateIdentifier("ration_card_number", e.target.value)
                }
                placeholder="Ration card number"
                className="input"
              />
            </Field>
          </div>
        </div>

        {/* Submit Button */}
        <div
          style={{
            padding: "20px 24px",
            borderTop: "1px solid var(--border-subtle)",
            background: "var(--bg-surface)",
            position: "sticky",
            bottom: 0,
            zIndex: 10,
          }}>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              padding: "12px 16px",
              fontSize: "15px",
              fontWeight: 600,
              borderRadius: "10px",
              transition: "all 0.25s ease",
              opacity: loading ? 0.85 : 1,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: success
                ? "0 0 0 2px rgba(34,197,94,0.2)"
                : "0 4px 12px rgba(0,0,0,0.08)",
            }}>
            {loading ? (
              <>
                <Spinner size={16} color="#fff" />
                <span style={{ letterSpacing: "0.3px" }}>
                  Encrypting & Anchoring...
                </span>
              </>
            ) : success ? (
              <>
                <FiCheck size={18} />
                <span>Issued Successfully</span>
              </>
            ) : (
              <>
                <FiSend size={18} />
                <span>Issue Credential</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// ============================================================
// Credentials List Component (Store Credentials)
// ============================================================
function CredentialsList() {
  const [creds, setCreds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCred, setSelectedCred] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      const res = await api.get("/issuer/credentials");
      setCreds(res.data);
    } catch (error) {
      toast.error("Failed to load credentials");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshCredentials = async () => {
    setRefreshing(true);
    await fetchCredentials();
    toast.success("Credentials refreshed");
  };

  const revokeCredential = async (credentialId) => {
    if (!confirm("Are you sure you want to revoke this credential?")) return;

    try {
      await api.post(`/issuer/revoke/${credentialId}`);
      toast.success("Credential revoked successfully");
      fetchCredentials();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Revocation failed");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (revoked) =>
    revoked ? "var(--c-red)" : "var(--c-green)";
  const getStatusText = (revoked) => (revoked ? "Revoked" : "Active");

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "60px 0",
        }}>
        <Spinner size={32} />
      </div>
    );
  }

  if (creds.length === 0) {
    return (
      <EmptyState
        icon="🔏"
        title="No credentials issued"
        message="Issue your first credential to get started."
      />
    );
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}>
        <PageHeader
          title="Issued Credentials"
          subtitle={`${creds.length} credentials anchored on blockchain`}
          icon={<FiList size={18} />}
          color="var(--c-issuer)"
        />
        <button
          onClick={refreshCredentials}
          disabled={refreshing}
          className="btn-ghost btn-sm"
          style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <FiRefreshCw size={14} className={refreshing ? "spin" : ""} />
          Refresh
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {creds.map((cred, index) => (
          <div
            key={index}
            className="card card-hover"
            style={{ padding: 0, overflow: "hidden", cursor: "pointer" }}
            onClick={() =>
              setSelectedCred(
                selectedCred?.credential_id === cred.credential_id
                  ? null
                  : cred,
              )
            }>
            <div style={{ padding: "18px 20px" }}>
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 12,
                  marginBottom: 16,
                }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: "rgba(147,197,253,0.1)",
                      border: "1px solid rgba(147,197,253,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                    }}>
                    🔏
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        fontFamily: "monospace",
                        color: "var(--text-primary)",
                        marginBottom: 4,
                      }}>
                      {cred.credential_id}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      Type: {cred.credential_type} • Issued:{" "}
                      {formatDate(cred.created_at)}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Badge variant={cred.revoked ? "error" : "success"}>
                    {getStatusText(cred.revoked)}
                  </Badge>
                  {!cred.revoked && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        revokeCredential(cred.credential_id);
                      }}
                      className="btn-danger btn-sm"
                      style={{ padding: "5px 12px" }}>
                      Revoke
                    </button>
                  )}
                </div>
              </div>

              {/* Basic Info */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 10,
                }}>
                <InfoRow label="Holder ID" value={cred.holder_id} mono />
                <InfoRow label="Hash ID" value={cred.hash_id} mono />
                {cred.expires_at && (
                  <InfoRow
                    label="Expires"
                    value={formatDate(cred.expires_at)}
                  />
                )}
              </div>

              {/* Expandable Details */}
              {selectedCred?.credential_id === cred.credential_id &&
                cred.credential_data && (
                  <div
                    style={{
                      marginTop: 20,
                      paddingTop: 16,
                      borderTop: "1px solid var(--border-subtle)",
                      animation: "fadeUp 0.2s ease",
                    }}>
                    <div style={{ marginBottom: 12 }}>
                      <span className="label">CREDENTIAL DATA</span>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: 10,
                      }}>
                      <InfoRow
                        label="Full Name"
                        value={cred.credential_data.full_name}
                      />
                      <InfoRow
                        label="Gender"
                        value={cred.credential_data.gender}
                      />
                      <InfoRow
                        label="State"
                        value={cred.credential_data.state}
                      />
                      <InfoRow label="Age" value={cred.credential_data.age} />
                      <InfoRow
                        label="Citizenship"
                        value={cred.credential_data.citizenship_status}
                      />
                      <InfoRow
                        label="Education"
                        value={cred.credential_data.education_level}
                      />
                      <InfoRow
                        label="Marital Status"
                        value={cred.credential_data.marital_status}
                      />
                      <InfoRow
                        label="License Valid"
                        value={
                          cred.credential_data.license_validity ? "Yes" : "No"
                        }
                      />
                      <InfoRow
                        label="Tax Compliant"
                        value={
                          cred.credential_data.tax_compliance ? "Yes" : "No"
                        }
                      />
                    </div>
                  </div>
                )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Logs Component
// ============================================================
function LogsList() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all"); // all, issued, revoked

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await api.get("/issuer/logs");
      setLogs(res.data);
    } catch (error) {
      toast.error("Failed to load logs");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshLogs = async () => {
    setRefreshing(true);
    await fetchLogs();
    toast.success("Logs refreshed");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  const getActionBadge = (action) => {
    switch (action) {
      case "issued":
        return <Badge variant="success">Issued</Badge>;
      case "revoked":
        return <Badge variant="error">Revoked</Badge>;
      default:
        return <Badge variant="info">{action}</Badge>;
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case "issued":
        return <FiSend size={14} />;
      case "revoked":
        return <FiX size={14} />;
      default:
        return <FiActivity size={14} />;
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (filter === "all") return true;
    return log.action === filter;
  });

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "60px 0",
        }}>
        <Spinner size={32} />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <EmptyState
        icon="📋"
        title="No logs available"
        message="Activity logs will appear here as credentials are issued or revoked."
      />
    );
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 12,
        }}>
        <PageHeader
          title="Activity Logs"
          subtitle={`${logs.length} total events recorded`}
          icon={<FiArchive size={18} />}
          color="var(--c-issuer)"
        />
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => setFilter("all")}
              className={`btn-sm ${filter === "all" ? "btn-primary" : "btn-ghost"}`}
              style={{ padding: "6px 12px" }}>
              All
            </button>
            <button
              onClick={() => setFilter("issued")}
              className={`btn-sm ${filter === "issued" ? "btn-primary" : "btn-ghost"}`}
              style={{ padding: "6px 12px" }}>
              Issued
            </button>
            <button
              onClick={() => setFilter("revoked")}
              className={`btn-sm ${filter === "revoked" ? "btn-primary" : "btn-ghost"}`}
              style={{ padding: "6px 12px" }}>
              Revoked
            </button>
          </div>
          <button
            onClick={refreshLogs}
            disabled={refreshing}
            className="btn-ghost btn-sm"
            style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <FiRefreshCw size={14} className={refreshing ? "spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
            }}>
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--border-subtle)",
                  background: "var(--bg-surface)",
                }}>
                <th
                  style={{
                    textAlign: "left",
                    padding: "14px 16px",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    fontSize: 11,
                    letterSpacing: "0.5px",
                  }}>
                  ACTION
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "14px 16px",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    fontSize: 11,
                    letterSpacing: "0.5px",
                  }}>
                  CREDENTIAL ID
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "14px 16px",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    fontSize: 11,
                    letterSpacing: "0.5px",
                  }}>
                  HOLDER ID
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "14px 16px",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    fontSize: 11,
                    letterSpacing: "0.5px",
                  }}>
                  TIMESTAMP
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "14px 16px",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    fontSize: 11,
                    letterSpacing: "0.5px",
                  }}>
                  RELATIVE
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, index) => (
                <tr
                  key={index}
                  style={{
                    borderBottom:
                      index < filteredLogs.length - 1
                        ? "1px solid var(--border-subtle)"
                        : "none",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(255,255,255,0.02)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }>
                  <td
                    style={{
                      padding: "14px 16px",
                      verticalAlign: "middle",
                    }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          background:
                            log.action === "issued"
                              ? "rgba(34,197,94,0.1)"
                              : "rgba(239,68,68,0.1)",
                          color:
                            log.action === "issued"
                              ? "var(--c-green)"
                              : "var(--c-red)",
                        }}>
                        {getActionIcon(log.action)}
                      </span>
                      {getActionBadge(log.action)}
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "14px 16px",
                      fontFamily: "monospace",
                      fontSize: 12,
                      color: "var(--text-primary)",
                    }}>
                    {log.credential_id}
                  </td>
                  <td
                    style={{
                      padding: "14px 16px",
                      fontFamily: "monospace",
                      fontSize: 12,
                      color: "var(--text-secondary)",
                    }}>
                    {log.holder_id}
                  </td>
                  <td
                    style={{
                      padding: "14px 16px",
                      fontSize: 12,
                      color: "var(--text-secondary)",
                    }}>
                    {formatDate(log.timestamp)}
                  </td>
                  <td
                    style={{
                      padding: "14px 16px",
                      fontSize: 12,
                      color: "var(--text-muted)",
                    }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <FiClock size={12} />
                      {getRelativeTime(log.timestamp)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginTop: 20,
          justifyContent: "flex-end",
        }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 14px",
            borderRadius: 8,
            background: "rgba(34,197,94,0.1)",
            fontSize: 12,
          }}>
          <FiSend size={12} color="var(--c-green)" />
          <span>
            Issued:{" "}
            <strong style={{ color: "var(--c-green)" }}>
              {logs.filter((l) => l.action === "issued").length}
            </strong>
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 14px",
            borderRadius: 8,
            background: "rgba(239,68,68,0.1)",
            fontSize: 12,
          }}>
          <FiX size={12} color="var(--c-red)" />
          <span>
            Revoked:{" "}
            <strong style={{ color: "var(--c-red)" }}>
              {logs.filter((l) => l.action === "revoked").length}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Main Issuer Dashboard Component
// ============================================================
export default function IssuerDashboard() {
  const [activeTab, setActiveTab] = useState("issue");

  return (
    <div>
      {/* Tab Navigation - Simple and Clean */}
      <div
        style={{
          display: "flex",
          gap: 4,
          borderBottom: "1px solid var(--border-subtle)",
          marginBottom: 28,
        }}>
        <button
          onClick={() => setActiveTab("issue")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 20px",
            borderRadius: "8px 8px 0 0",
            fontSize: 13,
            fontWeight: 500,
            fontFamily: "Outfit, sans-serif",
            background:
              activeTab === "issue" ? "var(--c-accent-dim)" : "transparent",
            color:
              activeTab === "issue" ? "var(--c-accent)" : "var(--text-muted)",
            borderBottom:
              activeTab === "issue"
                ? `2px solid var(--c-accent)`
                : "2px solid transparent",
            cursor: "pointer",
            transition: "all 0.15s",
          }}>
          <FiSend size={14} />
          Issue Credential
        </button>
        <button
          onClick={() => setActiveTab("stored")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 20px",
            borderRadius: "8px 8px 0 0",
            fontSize: 13,
            fontWeight: 500,
            fontFamily: "Outfit, sans-serif",
            background:
              activeTab === "stored" ? "var(--c-accent-dim)" : "transparent",
            color:
              activeTab === "stored" ? "var(--c-accent)" : "var(--text-muted)",
            borderBottom:
              activeTab === "stored"
                ? `2px solid var(--c-accent)`
                : "2px solid transparent",
            cursor: "pointer",
            transition: "all 0.15s",
          }}>
          <FiList size={14} />
          Issued Credentials
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 20px",
            borderRadius: "8px 8px 0 0",
            fontSize: 13,
            fontWeight: 500,
            fontFamily: "Outfit, sans-serif",
            background:
              activeTab === "logs" ? "var(--c-accent-dim)" : "transparent",
            color:
              activeTab === "logs" ? "var(--c-accent)" : "var(--text-muted)",
            borderBottom:
              activeTab === "logs"
                ? `2px solid var(--c-accent)`
                : "2px solid transparent",
            cursor: "pointer",
            transition: "all 0.15s",
          }}>
          <FiArchive size={14} />
          Logs
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "issue" && <IssueForm />}
      {activeTab === "stored" && <CredentialsList />}
      {activeTab === "logs" && <LogsList />}
    </div>
  );
}
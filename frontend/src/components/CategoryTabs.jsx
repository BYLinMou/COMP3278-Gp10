import { CATEGORIES } from "../lib/constants";

export default function CategoryTabs({ value, onChange }) {
  return <div className="category-tabs">{CATEGORIES.map((item) => <button key={item} className={`category-tab ${value === item ? "category-tab--active" : ""}`} onClick={() => onChange(item)} type="button">{item}</button>)}</div>;
}


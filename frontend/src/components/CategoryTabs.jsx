import { CATEGORIES } from "../lib/constants";

export default function CategoryTabs({ value, onChange }) {
  return (
    <div className="category-tabs" role="tablist" aria-label="Feed categories">
      {CATEGORIES.map((item) => {
        const isActive = value === item;
        return (
          <button
            key={item}
            className={`category-tab ${isActive ? "category-tab--active" : ""}`}
            onClick={() => onChange(item)}
            type="button"
            role="tab"
            aria-selected={isActive}
          >
            {item}
          </button>
        );
      })}
    </div>
  );
}

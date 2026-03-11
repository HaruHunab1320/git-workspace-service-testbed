import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import './CraftingPanel.css';

const WORKSTATION_EMOJI = {
  'hand-crafted': '\u270B',
  workbench: '\u{1FA9A}',
  forge: '\u{1F525}',
  loom: '\u{1F9F5}',
  kiln: '\u{1FAD9}',
  'enchanting table': '\u2728',
};

const RARITY_EMOJI = {
  common: '\u26AA',
  uncommon: '\u{1F7E2}',
  rare: '\u{1F535}',
  legendary: '\u{1F7E1}',
};

function CraftResult({ result, onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 3000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="craft-result-overlay" onClick={onDone}>
      <div className="craft-result-card">
        <div className="craft-result-title">{'\u2728'} Crafted!</div>
        <div
          className={`craft-result-quality quality-${result.item.quality.toLowerCase()}`}
        >
          {result.item.name}
        </div>
        <div className="craft-result-details">
          <div>Quality: {result.item.quality}</div>
          {result.item.comfort > 0 && <div>Comfort: {result.item.comfort}</div>}
          <div>XP gained: +{result.xp_gained}</div>
          <div>Craft time: {result.craft_time}h</div>
        </div>
        {result.level_up_messages.map((msg, i) => (
          <div key={i} className="craft-result-levelup">
            {msg}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CraftingPanel({ showToast }) {
  const [subTab, setSubTab] = useState('recipes');
  const [crafter, setCrafter] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [craftResult, setCraftResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [craftingData, recipesData, materialsData] = await Promise.all([
        api.getCrafting(),
        api.getRecipes(),
        api.getMaterials(),
      ]);
      setCrafter(craftingData.crafter);
      setRecipes(recipesData);
      setMaterials(materialsData);
    } catch (err) {
      console.error('Failed to fetch crafting data:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleGather = async (materialName) => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await api.gatherMaterial(materialName, 1);
      setCrafter(result.crafter);
      if (showToast) showToast(result.message);
      // Refresh materials list to update counts
      const materialsData = await api.getMaterials();
      setMaterials(materialsData);
      const recipesData = await api.getRecipes();
      setRecipes(recipesData);
    } catch (err) {
      if (showToast) showToast(err.message);
    }
    setBusy(false);
  };

  const handleCraft = async (recipe) => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await api.craftItem(recipe.name, recipe.workstation);
      setCraftResult(result);
      setCrafter(result.crafter);
      const [recipesData, materialsData] = await Promise.all([
        api.getRecipes(),
        api.getMaterials(),
      ]);
      setRecipes(recipesData);
      setMaterials(materialsData);
    } catch (err) {
      if (showToast) showToast(err.message);
    }
    setBusy(false);
  };

  const handleLearn = async (recipeName) => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await api.learnRecipe(recipeName);
      setCrafter(result.crafter);
      if (showToast) showToast(result.message);
      const recipesData = await api.getRecipes();
      setRecipes(recipesData);
    } catch (err) {
      if (showToast) showToast(err.message);
    }
    setBusy(false);
  };

  const handleEquip = async (toolIndex) => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await api.equipTool(toolIndex);
      setCrafter(result.crafter);
      if (showToast) showToast(result.message);
    } catch (err) {
      if (showToast) showToast(err.message);
    }
    setBusy(false);
  };

  const dismissResult = useCallback(() => setCraftResult(null), []);

  if (loading || !crafter) {
    return <div className="loading">Loading crafting...</div>;
  }

  const xpPercent =
    crafter.xp_for_next_level > 0
      ? Math.min(100, (crafter.experience / crafter.xp_for_next_level) * 100)
      : 0;

  const tools = crafter.crafted_items.filter(
    (item) => item.category === 'tool'
  );

  return (
    <div className="crafting-panel">
      <div className="card">
        <div className="crafter-header">
          <h3 className="card-title">{'\u{1F528}'} Crafting Workshop</h3>
          <div className="skill-badge">
            Lv. {crafter.skill_level}
            {crafter.equipped_tool && (
              <span title="Equipped tool"> | {crafter.equipped_tool}</span>
            )}
          </div>
        </div>
        <div className="xp-bar-container">
          <div className="xp-bar-fill" style={{ width: `${xpPercent}%` }} />
        </div>
        <div className="xp-label">
          {crafter.experience} / {crafter.xp_for_next_level} XP
        </div>
      </div>

      <div className="crafting-subtabs">
        <button
          className={`crafting-subtab ${subTab === 'recipes' ? 'active' : ''}`}
          onClick={() => setSubTab('recipes')}
        >
          Recipes
        </button>
        <button
          className={`crafting-subtab ${subTab === 'materials' ? 'active' : ''}`}
          onClick={() => setSubTab('materials')}
        >
          Materials
        </button>
        <button
          className={`crafting-subtab ${subTab === 'crafted' ? 'active' : ''}`}
          onClick={() => setSubTab('crafted')}
        >
          Crafted ({crafter.crafted_items.length})
        </button>
      </div>

      {subTab === 'materials' && (
        <div className="materials-grid">
          {materials.map((mat) => (
            <div
              key={mat.name}
              className={`material-card ${!mat.available_now ? 'unavailable' : ''}`}
            >
              <div className="material-name">
                {RARITY_EMOJI[mat.rarity] || ''} {mat.name}
              </div>
              <div className={`material-rarity rarity-${mat.rarity}`}>
                {mat.rarity}
              </div>
              <div className="material-desc">{mat.description}</div>
              <div className="material-footer">
                <span className="material-count">
                  In bag: {mat.in_inventory}
                </span>
                <button
                  className="btn-gather"
                  onClick={() => handleGather(mat.name)}
                  disabled={!mat.available_now || busy}
                >
                  {mat.available_now ? 'Gather' : 'Out of season'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {subTab === 'recipes' && (
        <div className="recipes-list">
          {recipes.map((recipe) => (
            <div
              key={recipe.name}
              className={`recipe-card ${!recipe.known ? 'locked' : ''}`}
            >
              <div className="recipe-top">
                <div>
                  <div className="recipe-name">
                    {recipe.known ? '' : '\u{1F512} '}
                    {recipe.name}
                  </div>
                  <div className="recipe-desc">{recipe.description}</div>
                </div>
                <span className="recipe-category">{recipe.category}</span>
              </div>
              <div className="recipe-meta">
                <span>
                  {WORKSTATION_EMOJI[recipe.workstation] || ''}{' '}
                  {recipe.workstation}
                </span>
                <span>Skill: {recipe.skill_requirement}</span>
                <span>Time: {recipe.base_craft_time}h</span>
                {recipe.comfort_score > 0 && (
                  <span>Comfort: {recipe.comfort_score}</span>
                )}
              </div>
              <div className="recipe-ingredients">
                {recipe.ingredient_status.map((ing) => (
                  <span
                    key={ing.material}
                    className={`ingredient-chip ${ing.have >= ing.needed ? 'have' : 'need'}`}
                  >
                    {ing.material}: {ing.have}/{ing.needed}
                  </span>
                ))}
              </div>
              {recipe.known ? (
                <button
                  className="btn-craft"
                  onClick={() => handleCraft(recipe)}
                  disabled={!recipe.can_craft || busy}
                >
                  {busy
                    ? 'Working...'
                    : recipe.can_craft
                      ? 'Craft'
                      : 'Missing materials or skill'}
                </button>
              ) : (
                <button
                  className="btn-learn"
                  onClick={() => handleLearn(recipe.name)}
                  disabled={busy}
                >
                  Learn Recipe
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {subTab === 'crafted' && (
        <>
          {crafter.crafted_items.length === 0 ? (
            <div className="card">
              <p style={{ textAlign: 'center', color: 'var(--brown-light)' }}>
                No items crafted yet. Gather materials and start crafting!
              </p>
            </div>
          ) : (
            <>
              <div className="card" style={{ marginBottom: 8 }}>
                <strong>Total Comfort:</strong> {crafter.total_comfort}
              </div>
              <div className="crafted-grid">
                {crafter.crafted_items.map((item, idx) => (
                  <div key={idx} className="crafted-card">
                    <div className="crafted-name">{item.name}</div>
                    <div
                      className={`crafted-quality quality-${item.quality.toLowerCase()}`}
                    >
                      {item.quality}
                    </div>
                    {item.comfort > 0 && (
                      <div className="crafted-stat">
                        Comfort: {item.comfort}
                      </div>
                    )}
                    {item.category === 'tool' && (
                      <>
                        <div className="crafted-stat">
                          Speed: {item.tool_speed_bonus > 0 ? '+' : ''}
                          {(item.tool_speed_bonus * 100).toFixed(0)}%
                        </div>
                        <button
                          className={`btn-equip ${crafter.equipped_tool === item.name ? 'equipped' : ''}`}
                          onClick={() => {
                            const toolIdx = tools.findIndex(
                              (t) => t.name === item.name
                            );
                            if (toolIdx >= 0) handleEquip(toolIdx);
                          }}
                          disabled={crafter.equipped_tool === item.name || busy}
                        >
                          {crafter.equipped_tool === item.name
                            ? 'Equipped'
                            : 'Equip'}
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {craftResult && (
        <CraftResult result={craftResult} onDone={dismissResult} />
      )}
    </div>
  );
}

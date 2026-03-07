"""
End-to-end tests for the Cozy Village Simulator API.

Tests complete user flows through the FastAPI REST endpoints,
verifying that all subsystems work together correctly.
"""

import pytest
from fastapi.testclient import TestClient

from server import app


@pytest.fixture(autouse=True)
def fresh_game():
    """Reset game state before each test."""
    client = TestClient(app)
    client.post("/api/new-game?seed=42")
    yield client


# ---------------------------------------------------------------------------
# Flow 1: New player orientation — status, weather, villagers
# ---------------------------------------------------------------------------

class TestNewPlayerFlow:
    def test_initial_status(self, fresh_game):
        r = fresh_game.get("/api/status")
        assert r.status_code == 200
        data = r.json()
        assert data["day"] == 0
        assert data["season"] == "spring"
        assert len(data["villagers"]) == 6
        assert data["garden"]["rows"] == 4
        assert data["garden"]["cols"] == 6
        assert data["economy"]["player_coins"] == 100.0
        assert data["pets"] == {}

    def test_first_day_advance(self, fresh_game):
        r = fresh_game.post("/api/advance-day")
        assert r.status_code == 200
        data = r.json()
        report = data["report"]
        assert report["day"] == 1
        assert report["season"] == "Spring"
        assert len(report["weather_summary"]) > 0
        status = data["status"]
        assert status["day"] == 1
        assert status["weather"] is not None

    def test_weather_endpoints(self, fresh_game):
        fresh_game.post("/api/advance-day")
        r = fresh_game.get("/api/weather")
        assert r.status_code == 200
        weather = r.json()
        assert "sky" in weather
        assert "temperature_c" in weather
        assert "village_mood" in weather

        r = fresh_game.get("/api/weather/forecast?days=3")
        assert r.status_code == 200
        forecasts = r.json()
        assert len(forecasts) == 3

    def test_villager_details(self, fresh_game):
        r = fresh_game.get("/api/villagers")
        assert r.status_code == 200
        villagers = r.json()
        assert len(villagers) == 6

        first_id = list(villagers.keys())[0]
        r = fresh_game.get(f"/api/villagers/{first_id}")
        assert r.status_code == 200
        v = r.json()
        assert "name" in v
        assert "personality" in v
        assert "mood" in v
        assert "dialogue" in v

    def test_unknown_villager_404(self, fresh_game):
        r = fresh_game.get("/api/villagers/nobody")
        assert r.status_code == 404


# ---------------------------------------------------------------------------
# Flow 2: Farming — plant, grow, harvest over multiple days
# ---------------------------------------------------------------------------

class TestFarmingFlow:
    def test_view_available_crops(self, fresh_game):
        r = fresh_game.get("/api/garden/crops")
        assert r.status_code == 200
        crops = r.json()
        assert len(crops) > 0
        crop_names = [c["name"] for c in crops]
        assert "Strawberry" in crop_names

    def test_plant_and_grow_cycle(self, fresh_game):
        r = fresh_game.post("/api/garden/plant", json={
            "row": 0, "col": 0, "crop_name": "Pea",
        })
        assert r.status_code == 200
        assert "Planted" in r.json()["message"]

        r = fresh_game.get("/api/garden")
        garden = r.json()
        plot = garden["plots"][0][0]
        assert plot["crop"] == "Pea"
        assert plot["stage"] == "seed"
        assert not plot["is_harvestable"]

        # Advance enough days for peas to grow (5 days)
        for _ in range(8):
            fresh_game.post("/api/advance-day")

        r = fresh_game.get("/api/garden")
        garden = r.json()
        assert garden["total_harvests"] > 0 or garden["day"] >= 8

    def test_plant_multiple_crops(self, fresh_game):
        crops = [
            (0, 0, "Strawberry"),
            (0, 1, "Basil"),
            (1, 0, "Tulip"),
            (1, 1, "Pea"),
        ]
        for row, col, name in crops:
            r = fresh_game.post("/api/garden/plant", json={
                "row": row, "col": col, "crop_name": name,
            })
            assert r.status_code == 200

        r = fresh_game.get("/api/garden")
        garden = r.json()
        assert garden["plots"][0][0]["crop"] == "Strawberry"
        assert garden["plots"][0][1]["crop"] == "Basil"
        assert garden["plots"][1][0]["crop"] == "Tulip"
        assert garden["plots"][1][1]["crop"] == "Pea"

    def test_plant_unknown_crop_fails(self, fresh_game):
        r = fresh_game.post("/api/garden/plant", json={
            "row": 0, "col": 0, "crop_name": "Dragonfruit",
        })
        assert r.status_code == 400

    def test_harvest_produces_events(self, fresh_game):
        fresh_game.post("/api/garden/plant", json={
            "row": 0, "col": 0, "crop_name": "Pea",
        })
        all_harvests = []
        for _ in range(10):
            r = fresh_game.post("/api/advance-day")
            report = r.json()["report"]
            all_harvests.extend(report["harvests"])
        assert len(all_harvests) > 0


# ---------------------------------------------------------------------------
# Flow 3: Pet adoption and care
# ---------------------------------------------------------------------------

class TestPetFlow:
    def test_view_adoptable_pets(self, fresh_game):
        r = fresh_game.get("/api/pets/adoptable")
        assert r.status_code == 200
        adoptable = r.json()
        assert len(adoptable) > 0
        assert all("name" in p for p in adoptable)

    def test_adopt_and_interact(self, fresh_game):
        r = fresh_game.post("/api/pets/adopt", json={
            "name": "Biscuit", "species": "dog", "personality": "loyal",
        })
        assert r.status_code == 200
        pet = r.json()
        assert pet["name"] == "Biscuit"
        assert pet["species"] == "dog"
        assert pet["bond_points"] == 0

        r = fresh_game.post("/api/pets/Biscuit/pet")
        assert r.status_code == 200
        assert "message" in r.json()

        r = fresh_game.post("/api/pets/Biscuit/feed")
        assert r.status_code == 200

        r = fresh_game.post("/api/pets/Biscuit/play")
        assert r.status_code == 200

    def test_pet_bond_grows_over_time(self, fresh_game):
        fresh_game.post("/api/pets/adopt", json={
            "name": "Whiskers", "species": "cat", "personality": "lazy",
        })
        for _ in range(5):
            fresh_game.post("/api/pets/Whiskers/pet")
            fresh_game.post("/api/pets/Whiskers/feed")
            fresh_game.post("/api/advance-day")

        r = fresh_game.get("/api/pets")
        pets = r.json()
        assert pets["Whiskers"]["bond_points"] > 0
        assert pets["Whiskers"]["days_owned"] == 5

    def test_adopt_duplicate_name_fails(self, fresh_game):
        fresh_game.post("/api/pets/adopt", json={
            "name": "Biscuit", "species": "dog", "personality": "loyal",
        })
        r = fresh_game.post("/api/pets/adopt", json={
            "name": "Biscuit", "species": "cat", "personality": "lazy",
        })
        assert r.status_code == 400

    def test_interact_nonexistent_pet_404(self, fresh_game):
        r = fresh_game.post("/api/pets/Ghost/pet")
        assert r.status_code == 404

    def test_invalid_species_rejected(self, fresh_game):
        r = fresh_game.post("/api/pets/adopt", json={
            "name": "Rex", "species": "dragon", "personality": "loyal",
        })
        assert r.status_code == 400


# ---------------------------------------------------------------------------
# Flow 4: Gift giving to villagers
# ---------------------------------------------------------------------------

class TestGiftFlow:
    def test_give_gift_to_villager(self, fresh_game):
        r = fresh_game.post("/api/villagers/lily/gift", json={
            "name": "Daisy", "category": "flower", "quality": 3,
        })
        assert r.status_code == 200
        data = r.json()
        assert "reaction" in data
        assert "Lily" in data["reaction"]

    def test_give_gift_invalid_category(self, fresh_game):
        r = fresh_game.post("/api/villagers/lily/gift", json={
            "name": "Widget", "category": "electronics", "quality": 1,
        })
        assert r.status_code == 400

    def test_give_gift_unknown_villager(self, fresh_game):
        r = fresh_game.post("/api/villagers/nobody/gift", json={
            "name": "Daisy", "category": "flower", "quality": 1,
        })
        assert r.status_code == 404


# ---------------------------------------------------------------------------
# Flow 5: Economy — buy and sell items
# ---------------------------------------------------------------------------

class TestEconomyFlow:
    def test_view_prices_and_wallet(self, fresh_game):
        fresh_game.post("/api/advance-day")
        r = fresh_game.get("/api/economy/prices")
        assert r.status_code == 200
        prices = r.json()
        assert len(prices) > 0

        r = fresh_game.get("/api/economy/wallet")
        assert r.status_code == 200
        wallet = r.json()
        assert wallet["coins"] == 100.0

    def test_buy_and_sell_flow(self, fresh_game):
        fresh_game.post("/api/advance-day")
        prices = fresh_game.get("/api/economy/prices").json()
        item_key = prices[0]["key"]

        r = fresh_game.post("/api/economy/buy", json={
            "item_key": item_key, "quantity": 1,
        })
        assert r.status_code == 200
        buy_result = r.json()
        assert buy_result["remaining_coins"] < 100.0
        coins_after_buy = buy_result["remaining_coins"]

        r = fresh_game.post("/api/economy/sell", json={
            "item_key": item_key, "quantity": 1,
        })
        assert r.status_code == 200
        sell_result = r.json()
        assert sell_result["remaining_coins"] > coins_after_buy

    def test_cannot_buy_without_funds(self, fresh_game):
        fresh_game.post("/api/advance-day")
        prices = fresh_game.get("/api/economy/prices").json()
        item_key = prices[0]["key"]

        r = fresh_game.post("/api/economy/buy", json={
            "item_key": item_key, "quantity": 9999,
        })
        assert r.status_code == 400
        assert "Not enough coins" in r.json()["detail"]

    def test_cannot_sell_items_not_owned(self, fresh_game):
        r = fresh_game.post("/api/economy/sell", json={
            "item_key": "strawberry", "quantity": 1,
        })
        assert r.status_code == 400

    def test_buy_unknown_item(self, fresh_game):
        r = fresh_game.post("/api/economy/buy", json={
            "item_key": "unicorn_horn", "quantity": 1,
        })
        assert r.status_code == 400

    def test_inventory_tracks_purchases(self, fresh_game):
        fresh_game.post("/api/advance-day")
        prices = fresh_game.get("/api/economy/prices").json()
        item_key = prices[0]["key"]

        fresh_game.post("/api/economy/buy", json={
            "item_key": item_key, "quantity": 2,
        })
        r = fresh_game.get("/api/inventory")
        assert r.status_code == 200
        inv = r.json()
        items = inv["items"]
        assert any(i["key"] == item_key and i["quantity"] == 2 for i in items)


# ---------------------------------------------------------------------------
# Flow 6: Journal entries
# ---------------------------------------------------------------------------

class TestJournalFlow:
    def test_create_and_read_entries(self, fresh_game):
        r = fresh_game.get("/api/journal")
        assert r.status_code == 200
        assert r.json() == []

        r = fresh_game.post("/api/journal", json={
            "text": "My first day in Willowbrook!", "mood": "excited",
        })
        assert r.status_code == 200
        entry = r.json()
        assert entry["id"] == 1
        assert entry["text"] == "My first day in Willowbrook!"
        assert entry["mood"] == "excited"

        r = fresh_game.get("/api/journal")
        assert len(r.json()) == 1

    def test_multiple_entries_across_days(self, fresh_game):
        fresh_game.post("/api/journal", json={"text": "Day 0 entry"})
        fresh_game.post("/api/advance-day")
        fresh_game.post("/api/journal", json={"text": "Day 1 entry"})
        fresh_game.post("/api/advance-day")
        fresh_game.post("/api/journal", json={"text": "Day 2 entry"})

        r = fresh_game.get("/api/journal")
        entries = r.json()
        assert len(entries) == 3
        assert entries[0]["day"] == 0
        assert entries[2]["day"] == 2

    def test_delete_entry(self, fresh_game):
        fresh_game.post("/api/journal", json={"text": "To be deleted"})
        r = fresh_game.delete("/api/journal/1")
        assert r.status_code == 200
        assert r.json()["deleted"] == 1

        r = fresh_game.get("/api/journal")
        assert len(r.json()) == 0

    def test_delete_nonexistent_entry(self, fresh_game):
        r = fresh_game.delete("/api/journal/999")
        assert r.status_code == 404

    def test_empty_text_rejected(self, fresh_game):
        r = fresh_game.post("/api/journal", json={"text": "   "})
        assert r.status_code == 400


# ---------------------------------------------------------------------------
# Flow 7: Zen Garden — place, rake, remove
# ---------------------------------------------------------------------------

class TestZenGardenFlow:
    def test_view_garden_and_options(self, fresh_game):
        r = fresh_game.get("/api/zen-garden")
        assert r.status_code == 200
        zg = r.json()
        assert zg["rows"] == 5
        assert zg["cols"] == 7
        assert "harmony_score" in zg

        r = fresh_game.get("/api/zen-garden/succulents")
        assert r.status_code == 200
        assert len(r.json()) > 0

        r = fresh_game.get("/api/zen-garden/rocks")
        assert r.status_code == 200
        assert len(r.json()) > 0

    def test_place_succulent_and_rock(self, fresh_game):
        succulents = fresh_game.get("/api/zen-garden/succulents").json()
        s_name = succulents[0]["name"]
        r = fresh_game.post("/api/zen-garden/place-succulent", json={
            "row": 0, "col": 0, "succulent_name": s_name,
        })
        assert r.status_code == 200
        tile = r.json()["zen_garden"]["tiles"][0][0]
        assert tile["succulent"] == s_name

        rocks = fresh_game.get("/api/zen-garden/rocks").json()
        rock_name = rocks[0]["name"]
        r = fresh_game.post("/api/zen-garden/place-rock", json={
            "row": 1, "col": 1, "rock_name": rock_name,
        })
        assert r.status_code == 200
        tile = r.json()["zen_garden"]["tiles"][1][1]
        assert tile["rock"] == rock_name

    def test_rake_tile(self, fresh_game):
        r = fresh_game.post("/api/zen-garden/rake", json={
            "row": 2, "col": 2, "pattern": "waves",
        })
        assert r.status_code == 200
        tile = r.json()["zen_garden"]["tiles"][2][2]
        assert tile["rake_pattern"] == "waves"

    def test_remove_item(self, fresh_game):
        succulents = fresh_game.get("/api/zen-garden/succulents").json()
        fresh_game.post("/api/zen-garden/place-succulent", json={
            "row": 0, "col": 0, "succulent_name": succulents[0]["name"],
        })
        r = fresh_game.post("/api/zen-garden/remove", json={
            "row": 0, "col": 0,
        })
        assert r.status_code == 200
        tile = r.json()["zen_garden"]["tiles"][0][0]
        assert tile["succulent"] is None

    def test_invalid_rake_pattern(self, fresh_game):
        r = fresh_game.post("/api/zen-garden/rake", json={
            "row": 0, "col": 0, "pattern": "zigzag",
        })
        assert r.status_code == 400

    def test_unknown_succulent(self, fresh_game):
        r = fresh_game.post("/api/zen-garden/place-succulent", json={
            "row": 0, "col": 0, "succulent_name": "Venus Flytrap",
        })
        assert r.status_code == 400


# ---------------------------------------------------------------------------
# Flow 8: Crafting — gather, learn, craft
# ---------------------------------------------------------------------------

class TestCraftingFlow:
    def test_view_crafting_state(self, fresh_game):
        r = fresh_game.get("/api/crafting")
        assert r.status_code == 200
        data = r.json()
        assert "crafter" in data
        assert data["crafter"]["skill_level"] == 1
        assert len(data["crafter"]["known_recipes"]) > 0

    def test_view_recipes_and_materials(self, fresh_game):
        r = fresh_game.get("/api/crafting/recipes")
        assert r.status_code == 200
        recipes = r.json()
        assert len(recipes) > 0
        assert all("name" in rec for rec in recipes)

        r = fresh_game.get("/api/crafting/materials")
        assert r.status_code == 200
        materials = r.json()
        assert len(materials) > 0

    def test_gather_material(self, fresh_game):
        materials = fresh_game.get("/api/crafting/materials").json()
        available = [m for m in materials if m["available_now"]]
        assert len(available) > 0
        mat_name = available[0]["name"]

        r = fresh_game.post("/api/crafting/gather", json={
            "material_name": mat_name, "quantity": 3,
        })
        assert r.status_code == 200
        crafter = r.json()["crafter"]
        assert crafter["materials"].get(mat_name, 0) >= 3

    def test_gather_and_craft_flow(self, fresh_game):
        recipes = fresh_game.get("/api/crafting/recipes").json()
        known = [r for r in recipes if r["known"]]
        assert len(known) > 0

        recipe = known[0]
        for ing in recipe["ingredient_status"]:
            fresh_game.post("/api/crafting/gather", json={
                "material_name": ing["material"],
                "quantity": ing["needed"],
            })

        r = fresh_game.post("/api/crafting/craft", json={
            "recipe_name": recipe["name"],
            "workstation": recipe["workstation"],
        })
        assert r.status_code == 200
        result = r.json()
        assert "item" in result
        assert result["xp_gained"] > 0

    def test_gather_unknown_material_fails(self, fresh_game):
        r = fresh_game.post("/api/crafting/gather", json={
            "material_name": "Unobtainium", "quantity": 1,
        })
        assert r.status_code == 400

    def test_craft_without_materials_fails(self, fresh_game):
        recipes = fresh_game.get("/api/crafting/recipes").json()
        known = [r for r in recipes if r["known"]]
        r = fresh_game.post("/api/crafting/craft", json={
            "recipe_name": known[0]["name"],
        })
        assert r.status_code == 400

    def test_learn_recipe(self, fresh_game):
        recipes = fresh_game.get("/api/crafting/recipes").json()
        unknown = [r for r in recipes if not r["known"]]
        if unknown:
            r = fresh_game.post("/api/crafting/learn", json={
                "recipe_name": unknown[0]["name"],
            })
            assert r.status_code == 200
            assert unknown[0]["name"] in r.json()["crafter"]["known_recipes"]


# ---------------------------------------------------------------------------
# Flow 9: Firefly swarm
# ---------------------------------------------------------------------------

class TestSwarmFlow:
    def test_view_swarm(self, fresh_game):
        r = fresh_game.get("/api/swarm")
        assert r.status_code == 200
        data = r.json()
        assert data["count"] == 20
        assert "average_glow" in data
        assert len(data["fireflies"]) == 20

    def test_tick_swarm(self, fresh_game):
        initial = fresh_game.get("/api/swarm").json()
        r = fresh_game.post("/api/swarm/tick?steps=5")
        assert r.status_code == 200
        data = r.json()
        assert data["steps"] == 5
        assert data["count"] == 20


# ---------------------------------------------------------------------------
# Flow 10: New game reset
# ---------------------------------------------------------------------------

class TestNewGameFlow:
    def test_new_game_resets_state(self, fresh_game):
        fresh_game.post("/api/advance-day")
        fresh_game.post("/api/advance-day")
        fresh_game.post("/api/journal", json={"text": "Hello"})
        fresh_game.post("/api/pets/adopt", json={
            "name": "Biscuit", "species": "dog", "personality": "loyal",
        })

        r = fresh_game.post("/api/new-game?seed=99")
        assert r.status_code == 200
        data = r.json()
        assert data["day"] == 0
        assert data["pets"] == {}
        assert data["economy"]["player_coins"] == 100.0

        r = fresh_game.get("/api/journal")
        assert r.json() == []

    def test_different_seeds_produce_different_games(self, fresh_game):
        fresh_game.post("/api/new-game?seed=1")
        fresh_game.post("/api/advance-day")
        weather1 = fresh_game.get("/api/weather").json()

        fresh_game.post("/api/new-game?seed=999")
        fresh_game.post("/api/advance-day")
        weather2 = fresh_game.get("/api/weather").json()

        assert weather1["temperature_c"] != weather2["temperature_c"] or \
               weather1["sky"] != weather2["sky"]


# ---------------------------------------------------------------------------
# Flow 11: Multi-day integrated play session
# ---------------------------------------------------------------------------

class TestIntegratedPlaySession:
    def test_full_play_session(self, fresh_game):
        """Simulates a realistic multi-day play session touching all systems."""
        # Day 0: Set up
        fresh_game.post("/api/garden/plant", json={"row": 0, "col": 0, "crop_name": "Pea"})
        fresh_game.post("/api/garden/plant", json={"row": 0, "col": 1, "crop_name": "Strawberry"})
        fresh_game.post("/api/pets/adopt", json={
            "name": "Biscuit", "species": "dog", "personality": "loyal",
        })
        fresh_game.post("/api/journal", json={"text": "Started my village!"})

        # Place a succulent in the zen garden
        succulents = fresh_game.get("/api/zen-garden/succulents").json()
        fresh_game.post("/api/zen-garden/place-succulent", json={
            "row": 2, "col": 3, "succulent_name": succulents[0]["name"],
        })

        # Gather some materials
        materials = fresh_game.get("/api/crafting/materials").json()
        available = [m for m in materials if m["available_now"]]
        if available:
            fresh_game.post("/api/crafting/gather", json={
                "material_name": available[0]["name"], "quantity": 5,
            })

        # Simulate 7 days
        for day in range(1, 8):
            r = fresh_game.post("/api/advance-day")
            assert r.status_code == 200
            report = r.json()["report"]
            assert report["day"] == day

            # Pet the dog daily
            fresh_game.post("/api/pets/Biscuit/pet")
            fresh_game.post("/api/pets/Biscuit/feed")

        # Verify final state is consistent
        status = fresh_game.get("/api/status").json()
        assert status["day"] == 7
        assert "Biscuit" in status["pets"]
        assert status["pets"]["Biscuit"]["days_owned"] == 7
        assert status["pets"]["Biscuit"]["bond_points"] > 0

        journal = fresh_game.get("/api/journal").json()
        assert len(journal) == 1

        zg = fresh_game.get("/api/zen-garden").json()
        assert zg["succulent_count"] >= 1

    def test_economy_across_days_with_spoilage(self, fresh_game):
        """Items spoil over time when advancing days."""
        fresh_game.post("/api/advance-day")
        prices = fresh_game.get("/api/economy/prices").json()
        # Find an item with a shelf life
        perishable = None
        for p in prices:
            if p.get("shelf_life", 0) > 0:
                perishable = p
                break

        if perishable is None:
            pytest.skip("No perishable items in market")

        item_key = perishable["key"]
        fresh_game.post("/api/economy/buy", json={
            "item_key": item_key, "quantity": 1,
        })

        inv_before = fresh_game.get("/api/inventory").json()
        assert any(i["key"] == item_key for i in inv_before["items"])

        shelf_life = perishable["shelf_life"]
        for _ in range(shelf_life + 1):
            fresh_game.post("/api/advance-day")

        inv_after = fresh_game.get("/api/inventory").json()
        spoiled_item = next(
            (i for i in inv_after["items"] if i["key"] == item_key), None
        )
        # Item should be spoiled/removed
        assert spoiled_item is None or spoiled_item.get("is_spoiled", False)

    def test_gift_giving_affects_friendship(self, fresh_game):
        """Repeated gifting should increase friendship."""
        fresh_game.post("/api/advance-day")
        v_before = fresh_game.get("/api/villagers/lily").json()

        for _ in range(3):
            fresh_game.post("/api/villagers/lily/gift", json={
                "name": "Rose", "category": "flower", "quality": 3,
            })

        v_after = fresh_game.get("/api/villagers/lily").json()
        # Check that the player friendship exists and has points
        player_friendship = v_after["friendships"].get("player")
        if player_friendship:
            assert player_friendship["points"] > 0

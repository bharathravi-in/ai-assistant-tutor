import asyncio
import sys
import os

# Add the current directory to sys.path to allow importing 'app'
sys.path.insert(0, os.getcwd())

from sqlalchemy import select
from app.database import async_session_maker
from app.models.config import State, District, Block, Cluster, School, Board, Medium

async def seed_bangalore_rural():
    async with async_session_maker() as db:
        print("🔍 Checking for Karnataka state...")
        # 1. Get Karnataka State
        result = await db.execute(select(State).where(State.name == "Karnataka"))
        karnataka = result.scalar_one_or_none()
        if not karnataka:
            print("❌ Karnataka state not found. Please run initial migrations first.")
            return
        
        print(f"✅ Found Karnataka (ID: {karnataka.id})")

        # 2. Get Board and Mediums
        result = await db.execute(select(Board).where(Board.code == "KAR"))
        kar_board = result.scalar_one_or_none()
        
        result = await db.execute(select(Medium).where(Medium.code == "EN"))
        eng_medium = result.scalar_one_or_none()
        
        result = await db.execute(select(Medium).where(Medium.code == "KN"))
        kan_medium = result.scalar_one_or_none()

        # 3. Create Bangalore Rural District
        result = await db.execute(
            select(District).where(District.name == "Bangalore Rural", District.state_id == karnataka.id)
        )
        bangalore_rural = result.scalar_one_or_none()
        if not bangalore_rural:
            bangalore_rural = District(name="Bangalore Rural", state_id=karnataka.id)
            db.add(bangalore_rural)
            await db.flush()
            print(f"✅ Created District: {bangalore_rural.name}")
        else:
            print(f"ℹ️ District {bangalore_rural.name} already exists")

        # 4. Create Blocks
        blocks_data = ["Devanahalli", "Doddaballapur", "Hoskote", "Nelamangala"]
        blocks = {}
        for block_name in blocks_data:
            result = await db.execute(
                select(Block).where(Block.name == block_name, Block.district_id == bangalore_rural.id)
            )
            block = result.scalar_one_or_none()
            if not block:
                block = Block(name=block_name, district_id=bangalore_rural.id)
                db.add(block)
                await db.flush()
                print(f"   ✅ Created Block: {block.name}")
            else:
                print(f"   ℹ️ Block {block.name} already exists")
            blocks[block_name] = block

        # 5. Create Clusters and Schools
        hierarchy = {
            "Devanahalli": {
                "Avathi": ["GHPS Avathi", "GLPS Avathi", "GHS Avathi"],
                "Devanahalli Town": ["GUBPS Devanahalli Town", "GLPS Fort Devanahalli"],
                "Kundana": ["GHPS Kundana", "GLPS Vishwanathapura"]
            },
            "Doddaballapur": {
                "Doddaballapur Town": ["GHPS Doddaballapur", "GHS Doddaballapur"],
                "Sasalu": ["GHPS Sasalu", "GLPS Sasalu"],
                "Tubagere": ["GHPS Tubagere", "GHS Tubagere"]
            },
            "Hoskote": {
                "Hoskote Town": ["GHPS Hoskote", "GLPS Hoskote"],
                "Sulibele": ["GHPS Sulibele", "GHS Sulibele"]
            },
            "Nelamangala": {
                "Nelamangala Town": ["GHPS Nelamangala", "GLPS Nelamangala"],
                "Tyayamagondlu": ["GHPS Tyayamagondlu", "GHS Tyayamagondlu"]
            }
        }

        for block_name, clusters_info in hierarchy.items():
            block = blocks[block_name]
            for cluster_name, schools_list in clusters_info.items():
                print(f"      Processing Cluster: {cluster_name} in {block_name}")
                # Create Cluster
                result = await db.execute(
                    select(Cluster).where(Cluster.name == cluster_name, Cluster.block_id == block.id)
                )
                cluster = result.scalar_one_or_none()
                if not cluster:
                    cluster = Cluster(name=cluster_name, block_id=block.id)
                    db.add(cluster)
                    await db.flush()
                    print(f"      ✅ Created Cluster: {cluster.name}")
                
                # Create Schools
                for school_name in schools_list:
                    result = await db.execute(
                        select(School).where(School.name == school_name, School.cluster_id == cluster.id)
                    )
                    school = result.scalar_one_or_none()
                    if not school:
                        # Randomize medium slightly
                        medium_id = kan_medium.id if ("GHPS" in school_name or "GLPS" in school_name) and kan_medium else (eng_medium.id if eng_medium else None)
                        
                        school = School(
                            name=school_name,
                            block_id=block.id,
                            cluster_id=cluster.id,
                            board_id=kar_board.id if kar_board else None,
                            medium_id=medium_id,
                            is_active=True
                        )
                        db.add(school)
                        print(f"         ✅ Created School: {school_name}")
        
        await db.commit()
        print("\n🚀 Seeding Bangalore Rural data completed successfully!")

if __name__ == "__main__":
    asyncio.run(seed_bangalore_rural())

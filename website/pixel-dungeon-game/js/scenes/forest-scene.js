define(['scenes/game-scene', 'models/npc'], function (GameScene, NPC) {
    var ForestScene = GameScene.extend({
        init: function (options) {
            this._super(options);
            this.heroClass = options.heroClass || 'NINJA'; // Default class
            this.npcs = [];

            // Add Orochimaru
            this.orochimaru = new NPC({
                name: 'Orochimaru',
                x: 0,
                y: 0,
                hp: 50,
                color: '#800080', // Purple
                symbol: 'O',
                aggressive: true
            });
            this.npcs.push(this.orochimaru);
        },

        generateDungeon: function () {
            // Forest generation: More open, green
            this.dungeon = [];
            for (var y = 0; y < this.dungeonHeight; y++) {
                this.dungeon[y] = [];
                for (var x = 0; x < this.dungeonWidth; x++) {
                    // 0 = Floor (Grass), 1 = Wall (Tree)
                    // Randomly place trees
                    this.dungeon[y][x] = Math.random() > 0.8 ? 1 : 0;
                }
            }

            // Ensure borders are trees
            for (var i = 0; i < this.dungeonWidth; i++) {
                this.dungeon[0][i] = 1;
                this.dungeon[this.dungeonHeight - 1][i] = 1;
            }
            for (var i = 0; i < this.dungeonHeight; i++) {
                this.dungeon[i][0] = 1;
                this.dungeon[i][this.dungeonWidth - 1] = 1;
            }

            // Find valid start pos
            var validStart = false;
            while (!validStart) {
                this.heroX = Math.floor(Math.random() * (this.dungeonWidth - 2)) + 1;
                this.heroY = Math.floor(Math.random() * (this.dungeonHeight - 2)) + 1;
                if (this.dungeon[this.heroY][this.heroX] === 0) validStart = true;
            }

            // Place Orochimaru far away
            var validBoss = false;
            while (!validBoss) {
                var bx = Math.floor(Math.random() * (this.dungeonWidth - 2)) + 1;
                var by = Math.floor(Math.random() * (this.dungeonHeight - 2)) + 1;
                if (this.dungeon[by][bx] === 0 && Math.abs(bx - this.heroX) > 10) {
                    this.orochimaru.x = bx;
                    this.orochimaru.y = by;
                    validBoss = true;
                }
            }

            this.updateCamera();
        },

        drawDungeon: function () {
            var viewWidth = Math.ceil(this.width / (this.tileSize * this.zoom)) + 1;
            var viewHeight = Math.ceil((this.height - 24 * this.zoom) / (this.tileSize * this.zoom)) + 1;

            for (var y = 0; y < viewHeight; y++) {
                for (var x = 0; x < viewWidth; x++) {
                    var tileX = this.cameraX + x;
                    var tileY = this.cameraY + y;

                    if (tileX >= 0 && tileX < this.dungeonWidth && tileY >= 0 && tileY < this.dungeonHeight) {
                        var tile = this.dungeon[tileY][tileX];
                        var drawX = x * this.tileSize * this.zoom;
                        var drawY = y * this.tileSize * this.zoom;
                        var size = this.tileSize * this.zoom;

                        if (tile === 0) {
                            // Grass
                            this.context.fillStyle = '#2d5a27'; // Dark Green
                            this.context.fillRect(drawX, drawY, size, size);
                            this.context.strokeStyle = '#22441d';
                            this.context.strokeRect(drawX, drawY, size, size);
                        } else {
                            // Tree
                            this.context.fillStyle = '#1a3317'; // Very Dark Green
                            this.context.fillRect(drawX, drawY, size, size);
                            this.context.fillStyle = '#3e2723'; // Trunk brown
                            this.context.fillRect(drawX + size * 0.3, drawY + size * 0.3, size * 0.4, size * 0.6);
                        }
                    }
                }
            }

            // Draw NPCs
            this.drawNPCs();
        },

        drawNPCs: function () {
            for (var i = 0; i < this.npcs.length; i++) {
                var npc = this.npcs[i];
                var screenX = (npc.x - this.cameraX) * this.tileSize * this.zoom;
                var screenY = (npc.y - this.cameraY) * this.tileSize * this.zoom;

                // Only draw if visible
                if (screenX >= -this.tileSize * this.zoom && screenX < this.width &&
                    screenY >= -this.tileSize * this.zoom && screenY < this.height) {

                    this.context.fillStyle = npc.color;
                    this.context.fillRect(screenX, screenY, this.tileSize * this.zoom, this.tileSize * this.zoom);

                    // HP bar
                    this.context.fillStyle = 'red';
                    this.context.fillRect(screenX, screenY - 5, this.tileSize * this.zoom, 4);
                    this.context.fillStyle = 'green';
                    var hpPct = npc.hp / npc.maxHp;
                    this.context.fillRect(screenX, screenY - 5, this.tileSize * this.zoom * hpPct, 4);
                }
            }
        },

        // Handle input - basic turn based move
        handleKeyPress: function (key) {
            if (!this.ready) return;

            // Hero Move
            this._super(key);

            // NPC Move
            this.updateNPCs();
        },

        updateNPCs: function () {
            var self = this;
            this.npcs.forEach(function (npc) {
                if (npc.aggressive && npc.hp > 0) {
                    // Simple AI: Move towards hero
                    var moved = npc.moveTowards(self.heroX, self.heroY, self.dungeon);

                    // Attack check
                    if (Math.abs(npc.x - self.heroX) <= 1 && Math.abs(npc.y - self.heroY) <= 1) {
                        // Attack!
                        self.health -= npc.damage;
                        if (self.health <= 0) {
                            alert("You were killed by " + npc.name + "!");
                            self.changeScene("TITLE");
                        }
                    }
                }
            });
        },

        // Override mouse click to attack
        onMouseDown: function (x, y, mouseEvent) {
            var tileX = Math.floor(x / (this.tileSize * this.zoom)) + this.cameraX;
            var tileY = Math.floor(y / (this.tileSize * this.zoom)) + this.cameraY;

            for (var i = 0; i < this.npcs.length; i++) {
                var npc = this.npcs[i];
                if (npc.x === tileX && npc.y === tileY) {
                    npc.hp -= 5;
                    if (npc.hp <= 0) {
                        npc.x = -1; // Hide
                        alert("You defeated " + npc.name + "!");
                    }
                    return;
                }
            }
        }
    });

    return ForestScene;
});

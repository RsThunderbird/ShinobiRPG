define([], function () {
    var NPC = function (options) {
        this.name = options.name || 'Enemy';
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.hp = options.hp || 10;
        this.maxHp = options.hp || 10;
        this.damage = options.damage || 2;
        this.symbol = options.symbol || 'E'; // For text fallback or visual id
        this.color = options.color || '#FF0000';
        this.aggressive = options.aggressive || false;
    };

    NPC.prototype.moveTowards = function (targetX, targetY, dungeon) {
        var dx = targetX - this.x;
        var dy = targetY - this.y;
        var newX = this.x;
        var newY = this.y;

        // Simple movement logic: Try to reduce largest difference
        if (Math.abs(dx) > Math.abs(dy)) {
            newX += dx > 0 ? 1 : -1;
        } else {
            newY += dy > 0 ? 1 : -1;
        }

        // Collision check
        if (dungeon[newY] && dungeon[newY][newX] === 0) { // 0 is floor
            this.x = newX;
            this.y = newY;
            return true;
        }
        return false;
    };

    return NPC;
});

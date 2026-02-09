import { Container, Sprite, Texture } from "pixi.js";

export class Symbol extends Container {
  private sprite: Sprite;
  public id: number;

  constructor(id: number, texture: Texture) {
    super();
    this.id = id;
    this.sprite = new Sprite(texture);
    this.sprite.anchor.set(0.5);
    this.addChild(this.sprite);
  }

  public setTexture(texture: Texture) {
    this.sprite.texture = texture;
  }

  public setSize(width: number, height: number) {
    this.sprite.width = width;
    this.sprite.height = height;
  }
}

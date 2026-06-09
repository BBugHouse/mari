import {StringSelectMenuBuilder, StringSelectMenuInteraction} from 'discord.js';
import Bot from '../Bot/Bot';

type onInteractType = (bot: Bot, interaction: StringSelectMenuInteraction) => void;

class SelectMenu {
	constructor(public readonly customId: string, public readonly selectBuilder: StringSelectMenuBuilder, public readonly onInteract: onInteractType) {
	}
}

export default SelectMenu;

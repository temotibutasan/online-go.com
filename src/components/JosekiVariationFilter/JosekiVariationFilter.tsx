/*
 * Copyright (C) 2012-2017  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import * as React from "react";
import { _, pgettext, interpolate } from "translate";

import * as player_cache from "player_cache";
import { tickStep } from "d3";
import { triggerAsyncId } from "async_hooks";

interface JosekiVariationFilterProps {
    godojo_headers: any;
    contributor_list_url: string;
    tag_list_url: string;
    source_list_url: string;
    set_variation_filter: any;
    current_filter: {contributor: number, tag: number, source: number};
}

export class JosekiVariationFilter extends React.PureComponent<JosekiVariationFilterProps, any> {
    constructor(props) {
        super(props);
        this.state = {
            contributor_list: [],
            tag_list: [],
            source_list: [],
            selected_contributor: this.props.current_filter['contributor'],
            selected_tag: this.props.current_filter['tag'],
            selected_source: this.props.current_filter['source']
        };
    }

    componentDidMount = () => {
        // Get the list of contributors to chose from
        fetch(this.props.contributor_list_url, {
            mode: 'cors',
            headers: this.props.godojo_headers
        })
        .then(res => res.json())
        .then(body => {
            //console.log("Server response to contributors GET:", body);
            let contributor_list = [];
            body.forEach((id, idx) => {
                //console.log("Looking up player", id, idx);
                const player = player_cache.lookup(id);
                contributor_list[idx] = {resolved: player !== null, player: player === null ? id : player};

                if (player === null) {
                    //console.log("fetching player", id, idx);
                    player_cache.fetch(id).then((p) => {
                        //console.log("fetched player", p, id, idx); // by some javascript miracle this is the correct value of idx
                        let contributor_list = [...this.state.contributor_list];
                        contributor_list[idx] = {resolved: true, player: p};
                        this.setState({contributor_list});
                    });
                }
            });
            this.setState({contributor_list});
        });

        fetch(this.props.tag_list_url, {
            mode: 'cors',
            headers: this.props.godojo_headers
        })
        .then(res => res.json())
        .then(body => {
            // console.log("Server response to tag GET:", body);
            this.setState({tag_list: body.tags});
        });

        fetch(this.props.source_list_url, {
            mode: 'cors',
            headers: this.props.godojo_headers
        })
        .then(res => res.json())
        .then(body => {
            //console.log("Server response to source GET:", body);
            this.setState({source_list: body.sources});
        });
    }

    onContributorChange = (e) => {
        this.setState({selected_contributor: e.target.value});
        this.props.set_variation_filter({...this.props.current_filter, contributor: parseInt(e.target.value)});
    }

    onTagChange = (e) => {
        this.setState({selected_tag: e.target.value});
        this.props.set_variation_filter({...this.props.current_filter, tag: parseInt(e.target.value)});
    }

    onSourceChange = (e) => {
        this.setState({selected_source: e.target.value});
        this.props.set_variation_filter({...this.props.current_filter, source: parseInt(e.target.value)});
    }

    render() {
        console.log("Variation filter render");
        // console.log("contributors", this.state.contributor_list);
        // console.log("tags", this.state.tag_list);
        // console.log("sources", this.state.source_list);

        let contributors = this.state.contributor_list.map((c, i) => {
            if (c.resolved) {
                return <option key={i} value={c.player.id}>{c.player.username}</option>;
            }
            else {
                return <option key={i} value={c.player}>{"(player " + c.player + ")"}</option>;
            }
        });

        contributors.unshift(<option key={-1} value={0}>({_("none")})</option>);

        let tags = this.state.tag_list.map((t, i) => (<option key={i} value={t.id}>{t.description}</option>));
        tags.unshift(<option key={-1} value={0}>({_("none")})</option>);

        let sources = this.state.source_list.map((s, i) => (<option key={i} value={s.id}>{s.description}</option>));
        sources.unshift(<option key={-1} value={0}>({_("none")})</option>);

        return (
            <div className="joseki-variation-filter">
                <div className="filter-set">
                    <div className="filter-label">Filter by Contributor</div>
                    <select value={this.state.selected_contributor} onChange={this.onContributorChange}>
                                {contributors}
                    </select>
                </div>

                <div className="filter-set">
                    <div className="filter-label">Filter by Tag</div>
                    <select value={this.state.selected_tag} onChange={this.onTagChange}>
                                {tags}
                    </select>
                </div>

                <div className="filter-set">
                    <div className="filter-label">Filter by Source</div>
                    <select value={this.state.selected_source} onChange={this.onSourceChange}>
                                {sources}
                    </select>
                </div>
            </div>
        );
    }


}


import json
import requests
import pathlib

# スクリプト自身の場所を基準に、書き込むJSONファイルのフルパスを定義
# これにより、GitHub Actionsの実行環境でも正しくファイルが配置される
SCRIPT_DIR = pathlib.Path(__file__).parent
JSON_FILE_PATH = SCRIPT_DIR / 'chunithm.json'

def merge_and_update_chunithm_data():
    """
    2つのCHUNITHMのJSONデータをマージして更新し、追加された楽曲情報を表示します。
    GitHub Actionsでの自動実行を想定しています。
    """
    target_data = []
    source_data = []
    added_songs = []

    # --- 1. 基本データの取得 ---
    try:
        target_url = "https://j105588.github.io/chunithm/chunithm.json"
        print(f"基本データを取得中: {target_url}")
        
        response_target = requests.get(target_url)
        response_target.raise_for_status()  # HTTPエラーがあればここで例外を発生させる
        target_data = response_target.json()

        print("基本データの取得と解析に成功しました。")
    except requests.exceptions.RequestException as e:
        print(f"エラー: 基本データの取得に失敗しました。URLやネットワーク接続を確認してください。詳細: {e}")
        return # 基本データがなければ処理を中断
    except json.JSONDecodeError as e:
        print(f"エラー: 基本データの解析に失敗しました。JSON形式が正しくない可能性があります。詳細: {e}")
        return # 基本データがなければ処理を中断

    # --- 2. レコードデータの取得 ---
    try:
        source_url = "https://reiwa.f5.si/chunithm_record.json"
        print(f"レコードデータを取得中: {source_url}")

        response_source = requests.get(source_url)
        response_source.raise_for_status()
        
        # BOM付きUTF-8ファイルに対応するため、'utf-8-sig'を指定してデコード
        decoded_text = response_source.content.decode('utf-8-sig')
        source_data = json.loads(decoded_text)

        print("レコードデータの取得と解析に成功しました。")
    except requests.exceptions.RequestException as e:
        print(f"警告: レコードデータの取得に失敗しました。処理は続行します。詳細: {e}")
        pass # レコードがなくても処理は続行可能
    except json.JSONDecodeError as e:
        print(f"警告: レコードデータの解析に失敗しました。処理は続行します。詳細: {e}")
        pass

    # --- 3. データのマージ処理 ---
    if not source_data:
        print("追加するレコードデータがありません。")
    else:
        try:
            # 効率的に検索できるよう、基本データを辞書形式に変換
            target_dict = {(item['title'], item['diff']): item for item in target_data}
            
            for record in source_data:
                # 必要なキーが存在しないレコードはスキップ
                if 'title' not in record or 'diff' not in record:
                    continue
                
                key = (record['title'], record['diff'])
                # 基本データに存在しない楽曲であれば、リストに追加
                if key not in target_dict:
                    new_song = {
                        "title": record.get("title"),
                        "artist": record.get("artist"),
                        "const": record.get("const"),
                        "diff": record.get("diff"),
                        "version": record.get("version")
                    }
                    target_data.append(new_song)
                    added_songs.append(new_song)
        except Exception as e:
            print(f"データのマージ処理中にエラーが発生しました: {e}")

    # --- 4. 結果の表示 ---
    if added_songs:
        print("\n--------------------")
        print(f"【 {len(added_songs)}件の新しい楽曲を追加しました 】")
        for song in added_songs:
            title = song.get('title', 'N/A')
            diff = song.get('diff', 'N/A')
            print(f"- {title} [{diff}]")
        print("--------------------\n")
    else:
        print("\n追加する新しい楽曲データはありませんでした。\n")
    
    # --- 5. ファイルへの書き込み ---
    if not target_data:
        print("書き込むデータがありません。ファイルは作成されませんでした。")
        return

    try:
        with open(JSON_FILE_PATH, 'w', encoding='utf-8') as f:
            json.dump(target_data, f, ensure_ascii=False, indent=4)
        print(f"'{JSON_FILE_PATH}' ファイルの更新が完了しました。")
    except Exception as e:
        print(f"ファイル書き込み中に致命的なエラーが発生しました: {e}")

# --- メイン処理の実行 ---
if __name__ == '__main__':
    merge_and_update_chunithm_data()
    print("\n処理が完了しました。")
